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

// Agent 缓存
const agentCache = new Map<string, Awaited<ReturnType<typeof createAgent>>>();

// MCP 工具缓存
const mcpToolsCache = new Map<string, DynamicTool[]>();

/**
 * 生成缓存 key，基于配置参数
 */
function getCacheKey(config?: AgentConfigOptions): string {
  const provider = config?.provider || "openai";
  const model =
    config?.model ||
    (provider === "aliyun" ? process.env.ALIYUN_MODEL_NAME : "gpt-4.1");
  const mcpUrl = config?.mcpUrl || "";
  const approveAllTools = config?.approveAllTools ? "approve" : "manual";

  return `${provider}:${model}:${mcpUrl}:${approveAllTools}`;
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
 *
 * @param config - 配置对象
 * @returns 新的 agent 实例
 */

export async function createAgent(config?: AgentConfigOptions) {
  const provider = config?.provider || "openai";
  const model =
    config?.model ||
    (provider === "aliyun" ? process.env.ALIYUN_MODEL_NAME : "gpt-4.1");
  const llm = createChatModel({ provider, model });

  // MCP Tools - 从配置中获取 MCP URL
  let mcptools: DynamicTool[] = [];

  if (config?.mcpUrl) {
    // 先检查缓存
    if (mcpToolsCache.has(config.mcpUrl)) {
      mcptools = mcpToolsCache.get(config.mcpUrl)!;
      console.log(`✅ 使用缓存的 MCP 工具: ${mcptools.length} 个`);
    } else {
      // 从 MCP 服务器加载
      try {
        console.log(`🔄 从服务器加载 MCP 工具: ${config.mcpUrl}`);
        const startTime = Date.now();

        const client = new MultiServerMCPClient({
          mcpServer: {
            transport: "http",
            url: config.mcpUrl,
          },
        });

        const tools = await client.getTools();
        mcptools = tools as any as DynamicTool[];

        const loadTime = Date.now() - startTime;
        console.log(
          `✅ 成功加载 ${mcptools.length} 个 MCP 工具 (耗时: ${loadTime}ms)`
        );

        // 缓存工具
        mcpToolsCache.set(config.mcpUrl, mcptools);

        // 打印每个工具的详细信息
        mcptools.forEach((tool, index) => {
          console.log(`🔧 MCP 工具 #${index + 1}:`, {
            name: tool.name,
            description: tool.description,
            schema: tool.schema,
          });
        });
      } catch (error) {
        console.error("❌ 加载 MCP 工具失败:", error);
      }
    }
  }

  // 内置工具
  const internalTools = getInternalTools(llm, createEmbeddingsModel());

  const allTools = [...internalTools, ...mcptools] as DynamicTool[];

  const agent = new AgentBuilder({
    llm,
    tools: allTools,
    prompt: config?.systemPrompt || SYSTEM_PROMPT,
    checkpointer: postgresCheckpointer,
  }).buildWithApproval(); // 使用带审批功能的构建方法，支持工具调用审批

  return agent;
}

// 公共辅助函数，用于显式检查准备状态并返回 Agent 实例
export async function ensureAgent(config?: AgentConfigOptions) {
  // 确保 checkpointer 已经完成初始化后再返回 Agent 实例
  await setupOnce();

  // 生成缓存 key
  const cacheKey = getCacheKey(config);

  // 检查缓存
  if (agentCache.has(cacheKey)) {
    console.log(`✅ 使用缓存的 Agent: ${cacheKey}`);
    return agentCache.get(cacheKey)!;
  }

  // 创建新 agent 并缓存
  console.log(`🆕 创建新的 Agent: ${cacheKey}`);
  const agent = await createAgent(config);
  agentCache.set(cacheKey, agent);

  return agent;
}

// 显式获取配置好的 Agent 的命名导出
export async function getAgent(config?: AgentConfigOptions) {
  return ensureAgent(config);
}

// 移除顶层 await，改为懒加载
let cachedAgent: Awaited<ReturnType<typeof ensureAgent>> | null = null;

export async function getDefaultAgent() {
  if (!cachedAgent) {
    cachedAgent = await ensureAgent();
  }
  return cachedAgent;
}
