import { ChatOpenAI } from "@langchain/openai";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { StateGraph, START, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, BaseMessage } from "@langchain/core/messages";

// MCP State Annotations
export const McpStateAnnotations = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

/**
 * 创建简单对话子图（无工具调用）
 */
function createSimpleChatSubgraph() {
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4",
    temperature: 0.7,
  });

  const simpleNode = async (state: typeof McpStateAnnotations.State) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
  };

  const workflow = new StateGraph(McpStateAnnotations)
    .addNode("agent", simpleNode)
    .addEdge(START, "agent");

  return workflow.compile();
}

/**
 * 创建 MCP 子图
 * @param mcpUrl MCP 服务器 URL，如果为空则使用简单对话模式
 */
export async function createMcpSubgraph(mcpUrl?: string) {
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || "gpt-4",
    temperature: 0.7,
  });

  // 降级策略 1: 无 URL 时使用简单对话
  if (!mcpUrl) {
    console.log("未配置 MCP URL，使用普通对话模式");
    return createSimpleChatSubgraph();
  }

  try {
    console.log(`尝试连接 MCP 服务器: ${mcpUrl}`);

    // 连接 MCP 服务器
    const client = new MultiServerMCPClient({
      mcpServer: {
        transport: "http",
        url: mcpUrl,
      },
    });

    // 获取工具列表
    const mcpTools = await client.getTools();
    console.log(`成功加载 ${mcpTools.length} 个 MCP 工具`);

    // 降级策略 2: 无工具时使用简单对话
    if (mcpTools.length === 0) {
      console.warn("未能加载 MCP 工具，使用普通对话模式");
      return createSimpleChatSubgraph();
    }

    // 创建 ToolNode
    const toolNode = new ToolNode(mcpTools);

    // 绑定工具到 LLM
    const llmWithTools = model.bindTools(mcpTools);

    // 条件判断函数：是否需要继续调用工具
    const shouldContinue = (state: typeof McpStateAnnotations.State) => {
      const lastMessage = state.messages[
        state.messages.length - 1
      ] as AIMessage;
      return lastMessage.tool_calls && lastMessage.tool_calls.length > 0
        ? "tools"
        : "end";
    };

    // LLM 节点
    const llmNode = async (state: typeof McpStateAnnotations.State) => {
      const response = await llmWithTools.invoke(state.messages);
      return { messages: [response] };
    };

    // 构建工作流
    const workflow = new StateGraph(McpStateAnnotations)
      .addNode("llmNode", llmNode)
      .addNode("tools", toolNode)
      .addEdge(START, "llmNode")
      .addConditionalEdges("llmNode", shouldContinue, {
        tools: "tools",
        end: "__end__",
      })
      .addEdge("tools", "llmNode");

    return workflow.compile();
  } catch (error) {
    // 降级策略 3: 连接失败时使用简单对话
    console.error("MCP 客户端初始化失败:", error);
    console.log("降级到普通对话模式");
    return createSimpleChatSubgraph();
  }
}
