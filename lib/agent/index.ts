import { AgentConfigOptions } from "@/types/agent";
import { postgresCheckpointer } from "./memory";
import { AgentBuilder } from "./builder";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { SYSTEM_PROMPT } from "./prompt";
import { getInternalTools } from "./tools";
import { DynamicTool } from "langchain";

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

/**
 *
 * @description 创建聊天Model
 *
 *
 * TODO 后期可进行扩展
 */
function createChatModel() {
  return new ChatOpenAI({
    modelName: "gpt-4.1",
    temperature: 0,
  });
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
  // TODO MCP Tools
  const mcptools: DynamicTool[] = [];

  // 内置工具
  const internalTools = getInternalTools(
    createChatModel(),
    createEmbeddingsModel()
  );

  const allTools = [...internalTools, ...mcptools] as DynamicTool[];

  const llm = createChatModel();
  const agent = new AgentBuilder({
    llm,
    tools: allTools,
    prompt: config?.systemPrompt || SYSTEM_PROMPT,
    checkpointer: postgresCheckpointer,
  }).build();

  return agent;
}

// 公共辅助函数，用于显式检查准备状态并返回 Agent 实例
export async function ensureAgent(config?: AgentConfigOptions) {
  // 确保 checkpointer 已经完成初始化后再返回 Agent 实例
  await setupOnce();
  return createAgent(config);
}

// 显式获取配置好的 Agent 的命名导出
export async function getAgent(config?: AgentConfigOptions) {
  return ensureAgent(config);
}

// 在模块加载时立即创建一个默认的 Agent 实例，使用环境变量中的默认配置
export const defaultAgent = await ensureAgent();
