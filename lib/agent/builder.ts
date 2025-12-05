/**
 * 构建 LangGraph Class 实例
 *
 * @description 构建 LangGraph Class 实例, 好处是可以方便地管理状态,并将状态存储在检查点中
 * @param model 模型实例 用于生成响应
 * @param checkpointer 检查点实例 用于状态管理
 * @param systemPrompt 系统提示词 用于引导模型行为
 * @returns LangGraph Class 实例
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  BaseCheckpointSaver,
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  AIMessage,
  BaseMessage,
  DynamicTool,
  SystemMessage,
  ToolMessage,
} from "langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";

export class AgentBuilder {
  private readonly model: BaseChatModel;
  private checkpointer?: BaseCheckpointSaver;
  private systemPrompt: string = "";
  private toolNode: ToolNode; // 工具节点, 用于执行外部操作
  private tools: DynamicTool[]; // 工具列表, 用于执行外部操作 TODO
  // private approveAllTools: boolean = false; // 如果为 true，工具调用将被自动批准，跳过人工批准环节

  constructor({
    tools,
    llm,
    checkpointer,
    prompt,
  }: {
    llm: BaseChatModel;
    checkpointer?: BaseCheckpointSaver;
    prompt?: string;
    tools?: DynamicTool[];
  }) {
    if (!llm) {
      throw new Error("llm is required");
    }
    this.model = llm;
    this.checkpointer = checkpointer;
    this.systemPrompt = prompt || "";
    // 存储工具列表并创建 ToolNode（ToolNode 负责工具调用流程）
    this.tools = tools || [];
    this.toolNode = new ToolNode(this.tools);
  }

  private async callModel(state: typeof MessagesAnnotation.State) {
    if (!this.model || !this.model.bindTools) {
      throw new Error("Invalid or missing language model (llm)");
    }

    // 把 systemPrompt 放到 messages 最前面 避免重复添加
    const messages = [new SystemMessage(this.systemPrompt), ...state.messages];

    // bindTools 会把工具能力连接到模型上（使模型可以发起 tool_calls）
    const modelInvoker = this.model.bindTools(this.tools);

    // 调用模型并获得回复（模型可能返回包含 tool_calls 的消息）
    const response = await modelInvoker.invoke(messages);

    return {
      messages: response,
    };
  }

  // 等待验证 目前执行错误
  // async toolNode(state: typeof MessagesAnnotation.State) {
  //   const toolsByName: Record<string, DynamicTool> = {};
  //   for (const tool of this.tools) {
  //     toolsByName[tool.name] = tool;
  //   }

  //   const messages = Array.isArray(state.messages) ? state.messages : [];
  //   console.log("🚀 ~ toolNode ~ messages:", messages);
  //   const lastMessage = messages.at
  //     ? messages.at(-1)
  //     : messages[messages.length - 1];

  //   // lastMessage 必须是 AIMessage，且包含 tool_calls

  //   if (
  //     lastMessage == null ||
  //     !this.isAIMessage(lastMessage) ||
  //     !lastMessage.tool_calls
  //   ) {
  //     return { messages: [] };
  //   }

  //   const result: ToolMessage[] = [];
  //   for (const toolCall of lastMessage.tool_calls ?? []) {
  //     const tool = toolsByName[toolCall.name];
  //     // 调用对应的工具
  //     const observation = await tool.invoke(toolCall);
  //     // 将 observation 添加到结果中
  //     result.push(observation);
  //   }

  //   return { messages: result };
  // }

  // 智能路由器 - 分析用户输入并决定是否需要工具
  private async routeQuery(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.constructor.name === "HumanMessage");

    if (!lastUserMessage) return "chatbot";

    const userInput = lastUserMessage.content.toString().toLowerCase();

    // 检查是否包含需要搜索的关键词
    const searchTriggers = [
      "http",
      "https",
      "www.",
      ".com",
      ".org",
      ".net", // URLs
      "latest",
      "current",
      "today",
      "recent",
      "new", // 时效性
      "what is",
      "how to",
      "explain",
      "documentation", // 查询性
      "langgraph",
      "langchain",
      "javascript",
      "python", // 技术术语
      "tutorial",
      "guide",
      "example",
      "API", // 学习资源
    ];

    const needsSearch = searchTriggers.some((trigger) =>
      userInput.includes(trigger)
    );

    if (needsSearch) {
      return "search_first";
    }

    return "chatbot";
  }

  // 增强的条件判断 - 决定下一步行动
  shouldContinue(state: typeof MessagesAnnotation.State) {
    console.log("Evaluating shouldContinue with state:", state);
    const lastMessage = state.messages.at(-1);
    if (lastMessage == null || !this.isAIMessage(lastMessage)) return END;

    // 如果 lastMessage 包含 tool_calls，则继续到工具节点
    if (lastMessage.tool_calls?.length) {
      return "tools";
    }

    // 检查是否需要补充信息
    const content = lastMessage.content.toString().toLowerCase();
    const needsMoreInfo = [
      "i need more information",
      "let me search for",
      "i should check",
      "requires verification",
    ].some((phrase) => content.includes(phrase));

    if (needsMoreInfo) {
      return "tools";
    }

    return END;
  }

  isAIMessage(msg: BaseMessage | undefined): msg is AIMessage {
    return msg != null && AIMessage.isInstance(msg);
  }

  build() {
    const stateGraph = new StateGraph(MessagesAnnotation)
      // 核心节点
      .addNode("chatbot", this.callModel.bind(this))
      .addNode("tools", this.toolNode)

      // 起始 → chatbot
      .addEdge(START, "chatbot")

      // chatbot 的条件路由
      .addConditionalEdges("chatbot", this.shouldContinue.bind(this), {
        tools: "tools",
        [END]: END,
      })

      // 工具执行后返回 chatbot
      .addEdge("tools", "chatbot");

    const compiledGraph = stateGraph.compile({
      checkpointer: this.checkpointer,
    });

    return compiledGraph;
  }
}
