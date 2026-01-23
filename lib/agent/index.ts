import { AgentConfigOptions } from "@/types/agent";
import { postgresCheckpointer } from "./memory";
import { AgentBuilder } from "./builder";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { SYSTEM_PROMPT } from "./prompt";
import { getInternalTools } from "./tools";
import { DynamicTool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { MCPError, AgentError } from "@/lib/errors";

// 用来标记是否已经开始设置
let setupPromise: Promise<void> | null = null;

/**
 * 确保 PostgresSaver 已经设置完成
 */
async function setupOnce() {
  if (!setupPromise) {
    setupPromise = postgresCheckpointer.setup().catch((error) => {
      setupPromise = null;
      throw error;
    });
  }
  await setupPromise;
}

// ================== MCP 工具缓存优化 ==================
// 全局单例 MCP Client 缓存 - 跨请求复用，避免重复加载
const mcpClientCache = new Map<string, MultiServerMCPClient>();
const mcpToolsCache = new Map<string, DynamicTool[]>();
const mcpLoadingPromises = new Map<string, Promise<DynamicTool[]>>();

// 工具元数据缓存 - 供前端 API 使用
export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: "internal" | "mcp";
  schema?: any;
}
const mcpToolsMetadataCache = new Map<string, ToolMetadata[]>();

/**
 * 获取或创建 MCP Client（全局单例）
 */
function getOrCreateMCPClient(mcpUrl: string): MultiServerMCPClient {
  if (!mcpClientCache.has(mcpUrl)) {
    console.log(`🔌 创建新的 MCP Client 单例: ${mcpUrl}`);
    const client = new MultiServerMCPClient({
      mcpServer: {
        transport: "http",
        url: mcpUrl,
      },
    });
    mcpClientCache.set(mcpUrl, client);
  }
  return mcpClientCache.get(mcpUrl)!;
}

/**
 * 加载 MCP 工具（带防抖，避免并发请求重复加载）
 */
async function loadMCPTools(mcpUrl: string): Promise<DynamicTool[]> {
  // 如果已有缓存，直接返回
  if (mcpToolsCache.has(mcpUrl)) {
    const cached = mcpToolsCache.get(mcpUrl)!;
    console.log(`✅ 使用 MCP 工具缓存: ${cached.length} 个工具 (${mcpUrl})`);
    return cached;
  }

  // 如果正在加载中，等待现有的加载完成（防抖）
  if (mcpLoadingPromises.has(mcpUrl)) {
    console.log(`⏳ 等待 MCP 工具加载完成: ${mcpUrl}`);
    return await mcpLoadingPromises.get(mcpUrl)!;
  }

  // 开始新的加载
  console.log(`🔄 从服务器加载 MCP 工具: ${mcpUrl}`);
  const startTime = Date.now();

  const loadPromise = (async () => {
    try {
      const client = getOrCreateMCPClient(mcpUrl);
      const tools = (await client.getTools()) as any as DynamicTool[];

      const loadTime = Date.now() - startTime;
      console.log(
        `✅ MCP 工具加载完成: ${tools.length} 个工具 (耗时: ${loadTime}ms, URL: ${mcpUrl})`,
      );

      // 缓存工具
      mcpToolsCache.set(mcpUrl, tools);

      // 缓存工具元数据
      const metadata: ToolMetadata[] = tools.map((tool) => ({
        id: `mcp:${tool.name}`,
        name: tool.name,
        description: tool.description || "",
        category: "mcp" as const,
        schema: tool.schema,
      }));
      mcpToolsMetadataCache.set(mcpUrl, metadata);

      // 打印工具详情（仅首次加载且开发模式）
      if (process.env.NODE_ENV === "development") {
        tools.forEach((tool, index) => {
          console.log(`🔧 MCP 工具 #${index + 1}:`, {
            name: tool.name,
            description: tool.description,
            schema: tool.schema,
          });
        });
      }

      return tools;
    } finally {
      // 加载完成后移除 loading promise
      mcpLoadingPromises.delete(mcpUrl);
    }
  })();

  // 记录正在加载的 promise
  mcpLoadingPromises.set(mcpUrl, loadPromise);

  return await loadPromise;
}

/**
 *
 * @description 创建聊天Model
 *
 *
 * TODO 后期可进行扩展
 */

interface ChatModelOptions {
  provider?: string;
  model?: string;
  temperature?: number;
}
function createChatModel({
  provider = "openai",
  model,
  temperature = 1,
}: ChatModelOptions) {
  console.log("Creating chat model:", { provider, model });

  switch (provider) {
    case "aliyun":
      return new ChatOpenAI({
        model,
        temperature,
        apiKey: process.env.ALIYUN_API_KEY,
        configuration: {
          baseURL: process.env.ALIYUN_BASE_URL,
        },
      });
    case "openai":
      return new ChatOpenAI({
        modelName: "gpt-4.1",
        temperature: temperature,
      });

    case "gemini":
      console.log("Using Gemini model");
      return new ChatGoogleGenerativeAI({
        model: process.env.GOOGLE_MODEL_NAME || "gemini-3-pro-image-preview",
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.7,
        streaming: true, // 启用流式响应
      });
    default:
      return new ChatOpenAI({
        modelName: "gpt-4.1",
        temperature: temperature,
      });
      break;
  }
}

function createEmbeddingsModel() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
  });
}

/**
 * 创建新的 agent 实例根据提供的配置
 * 注意：每次调用都会创建新实例，避免 Vercel Serverless 多实例间的状态污染
 *
 * @param config - 配置对象
 * @returns 新的 agent 实例
 */
export async function createAgent(config?: AgentConfigOptions) {
  const provider = config?.provider || "openai";
  const model =
    config?.model ||
    (provider === "aliyun" ? process.env.ALIYUN_MODEL_NAME : "gpt-4.1");

  console.log(
    `🆕 Creating new agent instance - Provider: ${provider}, Model: ${model}`,
  );

  const llm = createChatModel({ provider, model });

  // MCP Tools - 从配置中获取 MCP URL
  let mcptools: DynamicTool[] = [];
  let mcpLoadError: MCPError | null = null;

  if (config?.mcpUrl) {
    try {
      // 使用优化后的加载函数（自动处理缓存和防抖）
      mcptools = await loadMCPTools(config.mcpUrl);
    } catch (error) {
      // 存储错误但不中断 Agent 创建，实现降级策略
      mcpLoadError = new MCPError(
        "Failed to load MCP tools - continuing with built-in tools only",
        config.mcpUrl,
        undefined,
      );
      console.error("❌ 加载 MCP 工具失败:", error);
      console.warn("⚠️  降级策略：将仅使用内置工具继续运行");
    }
  }

  // 内置工具
  let internalTools = getInternalTools(llm, createEmbeddingsModel());

  // 工具过滤：如果提供了 enabledTools，则只加载选中的工具
  if (config?.enabledTools && config.enabledTools.length > 0) {
    const enabledSet = new Set(config.enabledTools);

    // 过滤内置工具
    const filteredInternalTools = internalTools.filter((tool) => {
      const toolId = `internal:${tool.name}`;
      return enabledSet.has(toolId) || enabledSet.has("internal:*");
    });

    // 过滤 MCP 工具
    const filteredMCPTools = mcptools.filter((tool) => {
      const toolId = `mcp:${tool.name}`;
      // 支持精确匹配、通配符 mcp:* 和前缀匹配 (e.g., mcp:oss_*)
      if (enabledSet.has(toolId) || enabledSet.has("mcp:*")) {
        return true;
      }
      // 检查前缀匹配
      for (const pattern of enabledSet) {
        if (pattern.startsWith("mcp:") && pattern.endsWith("*")) {
          const prefix = pattern.slice(4, -1); // 去除 "mcp:" 和 "*"
          if (tool.name.startsWith(prefix)) {
            return true;
          }
        }
      }
      return false;
    });

    internalTools = filteredInternalTools;
    mcptools = filteredMCPTools;

    console.log(
      `📊 Enabled ${filteredInternalTools.length + filteredMCPTools.length} tools (internal: ${filteredInternalTools.length}, MCP: ${filteredMCPTools.length}) based on selection`,
    );
    if (filteredInternalTools.length + filteredMCPTools.length > 0) {
      const toolNames = [
        ...filteredInternalTools.map((t) => `internal:${t.name}`),
        ...filteredMCPTools.map((t) => `mcp:${t.name}`),
      ];
      console.log(`🔧 Filtered tools:`, toolNames.join(", "));
    }
  } else {
    console.log(
      `📊 工具统计: 内置工具 ${internalTools.length} 个, MCP工具 ${mcptools.length} 个`,
    );
  }

  const allTools = [...internalTools, ...mcptools] as DynamicTool[];

  const agentBuilder = new AgentBuilder({
    llm,
    tools: allTools,
    prompt: config?.systemPrompt || SYSTEM_PROMPT,
    checkpointer: postgresCheckpointer,
  });

  // 根据配置选择是否启用工具调用审批
  // 如果 autoToolCall 为 true，使用 build() 自动执行工具
  // 否则使用 buildWithApproval() 需要人工确认
  const agent = config?.autoToolCall
    ? agentBuilder.build()
    : agentBuilder.buildWithApproval();

  // 如果 MCP 加载失败，在 agent 上附加元数据供后续使用
  if (mcpLoadError) {
    (agent as any).mcpLoadError = mcpLoadError;
  }

  console.log(`✅ Agent instance created successfully`);

  return agent;
}

/**
 * 确保 checkpointer 已初始化并创建新的 agent 实例
 * 注意：不再使用缓存，每次都创建新实例以避免 Vercel 多实例状态问题
 * @throws {AgentError} 当 Agent 初始化失败时
 */
export async function ensureAgent(config?: AgentConfigOptions) {
  try {
    // 确保 checkpointer 已经完成初始化
    await setupOnce();

    // 直接创建新的 agent 实例，不使用缓存
    return await createAgent(config);
  } catch (error) {
    throw new AgentError("Failed to initialize agent", {
      provider: config?.provider,
      model: config?.model,
    });
  }
}

// 显式获取配置好的 Agent 的命名导出
export async function getAgent(config?: AgentConfigOptions) {
  return ensureAgent(config);
}

/**
 * 预热 MCP 工具缓存（后台异步加载）
 * 在应用启动时调用，避免第一个用户请求时等待 MCP 工具加载
 * @param mcpUrl MCP 服务器 URL
 */
export function warmupMCPTools(mcpUrl: string): void {
  // 异步预加载，不阻塞主流程
  loadMCPTools(mcpUrl).catch((error) => {
    console.warn(`⚠️  MCP 工具预热失败 (${mcpUrl}):`, error);
  });
}

/**
 * 获取 MCP 工具元数据（供 API 使用）
 * @param mcpUrl MCP 服务器 URL
 * @returns 工具元数据数组，如果未加载则返回 null
 */
export function getMCPToolsMetadata(mcpUrl: string): ToolMetadata[] | null {
  return mcpToolsMetadataCache.get(mcpUrl) || null;
}

/**
 * 获取内置工具元数据
 */
export function getInternalToolsMetadata(): ToolMetadata[] {
  return [
    {
      id: "internal:get_weather",
      name: "get_weather",
      description: "Get current weather information for a specific location",
      category: "internal",
    },
    {
      id: "internal:calculator",
      name: "calculator",
      description: "Calculate the result of a mathematical expression",
      category: "internal",
    },
    {
      id: "internal:search_web",
      name: "search_web",
      description: "Search the web and return URLs with brief snippets",
      category: "internal",
    },
    {
      id: "internal:web_browser",
      name: "web_browser",
      description: "Browse web pages and extract full content",
      category: "internal",
    },
  ];
}
