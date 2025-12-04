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
import { SystemMessage } from "langchain";

export class AgentBuilder {
  private readonly model: BaseChatModel;
  private checkpointer?: BaseCheckpointSaver;
  private systemPrompt: string = "";
  // private toolNode: ToolNode; // 工具节点, 用于执行外部操作 TODO
  // private tools: DynamicTool[]; // 工具列表, 用于执行外部操作 TODO
  // private approveAllTools: boolean = false; // 如果为 true，工具调用将被自动批准，跳过人工批准环节

  constructor({
    llm,
    checkpointer,
    prompt,
  }: {
    llm: BaseChatModel;
    checkpointer?: BaseCheckpointSaver;
    prompt?: string;
  }) {
    if (!llm) {
      throw new Error("llm is required");
    }
    this.model = llm;
    this.checkpointer = checkpointer;
    this.systemPrompt = prompt || "";
  }

  private async callModel(state: typeof MessagesAnnotation.State) {
    if (!this.model) {
      throw new Error("Invalid or missing language model (llm)");
    }

    // 把 systemPrompt 放到 messages 最前面 避免重复添加
    const messages = [new SystemMessage(this.systemPrompt), ...state.messages];

    const response = await this.model.invoke(messages);
    return {
      messages: response,
    };
  }

  build() {
    const stateGraph = new StateGraph(MessagesAnnotation)
      .addNode("chatbot", this.callModel.bind(this))
      .addEdge(START, "chatbot")
      .addEdge("chatbot", END);

    const compiledGraph = stateGraph.compile({
      checkpointer: this.checkpointer,
    });

    return compiledGraph;
  }
}
