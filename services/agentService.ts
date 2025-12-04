import type { MessageOptions, MessageResponse } from "@/types/message";
import { ensureThread } from "@/lib/thread";
import { BaseMessage, HumanMessage } from "langchain";
import { ensureAgent } from "@/lib/agent";
import prisma from "@/lib/database/pirsma";
import { getHistory } from "@/lib/agent/memory";

export async function streamResponse(params: {
  threadId: string;
  userText: string;
  opts?: MessageOptions;
}) {
  const { threadId, userText } = params;

  // 确保 threadID 存在
  await ensureThread(threadId, userText);

  // TODO tool calls and agent logic here
  const inputs = {
    messages: [new HumanMessage(userText)],
  };

  // TODO 多模型、多agent 工具调用支持
  const agent = await ensureAgent();

  const inerable = await agent.stream(inputs, {
    streamMode: "messages", // 使用 messages 模式获取流式 token
    configurable: { thread_id: threadId },
  });

  // 该生成器遍历 LangGraph agent 返回的可迭代流（iterable），并将内部的 chunk
  // 元组转换为项目所需的 `MessageResponse` 结构。

  async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
    for await (const chunk of inerable) {
      // chunk 不存在 跳过继续
      if (!chunk) continue;

      // 调试信息：打印原始 chunk 负载，便于排查流式行为
      console.log("🚀 ~ generator ~ chunk:", chunk);

      // streamMode: "messages" 返回的是 [message, metadata] 格式
      if (!Array.isArray(chunk) || chunk.length < 1) continue;

      const [message, metadata] = chunk;

      // 只处理 AI 消息的增量内容
      const isAIMessageChunk =
        message?.constructor?.name === "AIMessageChunk" ||
        message?.constructor?.name === "AIMessage";

      if (!isAIMessageChunk) continue;

      const processedMessage = processAIMessage(message);

      if (processedMessage) {
        // 将处理后的消息作为生成器输出
        yield processedMessage;
      }
    }
  }

  // question 为什么使用 generator 函数处理，而不是直接返回 iterable？
  // ans: 通过使用 generator 函数，我们可以在每次迭代时对数据进行处理和转换，
  // 从而确保输出符合前端预期的 MessageResponse 结构。此外，生成器函数允许我们
  // 使用异步操作（如 await）来处理每个数据块，这在直接返回 iterable 时是无法实现的。

  // 返回生成器
  return generator();
}

// 辅助函数：处理任意 AI 消息并返回适当的 MessageResponse
function processAIMessage(message: BaseMessage): MessageResponse | null {
  // TODO  tookl_calls 以及其他字段的处理逻辑

  // 非 工具的 AI 消息处理： 提取可读文本。不同的 LLM/运行时可能将文本表示为字符串或
  // 内容块数组，这里将两种情况归一化为一个字符串供前端使用。

  let content = "";

  if (typeof message.content === "string") {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    // 假设内容块数组中的每个块都有一个 text 字段
    content = message.content
      .map((item) =>
        item && typeof item === "object" && "text" in item
          ? String(item.text)
          : ""
      )
      .join("");
  } else {
    // 无法处理的内容格式
    content = String(message.content || "");
  }

  // 如果存在有意义的文本，则以前端期望的轻量型 BasicMessageData 形式返回。
  // 对空或仅包含空白的内容则忽略返回。
  if (content.trim()) {
    return {
      type: "ai",
      data: {
        id: String(message.id) || Date.now().toString(),
        content,
      },
    };
  }
  // 如果没有有意义的内容可返回，就标记为null，以便调用者忽略它。
  return null;
}

export async function fetchThreadHistory(
  threadId: string
): Promise<MessageResponse[]> {
  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return [];
  try {
    const history = await getHistory(threadId);
    return history.map((msg: BaseMessage) => msg.toDict() as MessageResponse);
  } catch (e) {
    console.error("fetchThreadHistory error", e);
    return [];
  }
}
