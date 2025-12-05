import type {
  MessageOptions,
  MessageResponse,
  ToolCall,
} from "@/types/message";
import { ensureThread } from "@/lib/thread";
import { BaseMessage, HumanMessage } from "langchain";
import { ensureAgent } from "@/lib/agent";
import prisma from "@/lib/database/pirsma";
import { getHistory } from "@/lib/agent/memory";

// LangChain 流式消息的扩展类型
interface AIMessageChunkLike extends BaseMessage {
  tool_calls?: ToolCall[];
  tool_call_chunks?: Array<{
    index?: number;
    id?: string;
    name?: string;
    args?: string;
    type?: string;
  }>;
}

interface ToolMessageLike extends BaseMessage {
  tool_call_id?: string;
  name?: string;
}

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
    // streamMode: "updates", // 使用 updates 模式获取流式更新
    configurable: { thread_id: threadId },
  });

  // 该生成器遍历 LangGraph agent 返回的可迭代流（iterable），并将内部的 chunk
  // 元组转换为项目所需的 `MessageResponse` 结构。

  async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
    // 用于累积工具调用片段，key 是 tool_call 的 index
    const toolCallAccumulators: Map<
      number,
      { id: string; name: string; args: string }
    > = new Map();

    // 当前正在处理的 AI 消息 ID（用于关联工具调用和文本）
    let currentAIMessageId: string | null = null;

    // 文本内容缓冲区（用于处理不完整的代码块）
    let contentBuffer = "";
    // 上次发送的位置
    let lastSentIndex = 0;

    // 检查代码块是否完整的辅助函数
    function findSafeBreakPoint(text: string): number {
      // 计算未闭合的代码块数量
      const codeBlockPattern = /```/g;
      let count = 0;
      let lastIndex = 0;
      let match;

      while ((match = codeBlockPattern.exec(text)) !== null) {
        count++;
        lastIndex = match.index;
      }

      // 如果代码块数量为奇数，说明有未闭合的代码块
      if (count % 2 === 1) {
        // 找到最后一个 ``` 的位置，在它之前截断
        return lastIndex;
      }

      // 所有代码块都已闭合，可以安全发送全部内容
      return text.length;
    }

    for await (const chunk of inerable) {
      if (!chunk) continue;

      console.log("🚀 ~ generator ~ chunk:", chunk);

      // streamMode: "messages" 返回的是 [message, metadata] 格式
      if (!Array.isArray(chunk) || chunk.length < 1) continue;

      const [message, metadata] = chunk;

      // 处理 ToolMessage（工具执行结果）
      if (
        message?.constructor?.name === "ToolMessage" ||
        message?.constructor?.name === "ToolMessageChunk"
      ) {
        const toolMsg = message as ToolMessageLike;
        yield {
          type: "tool",
          data: {
            id: toolMsg.id || Date.now().toString(),
            content:
              typeof toolMsg.content === "string"
                ? toolMsg.content
                : JSON.stringify(toolMsg.content),
            status: "success",
            tool_call_id: toolMsg.tool_call_id || "",
            name: toolMsg.name || "",
          },
        };
        continue;
      }

      // 只处理 AI 消息
      const isAIMessageChunk =
        message?.constructor?.name === "AIMessageChunk" ||
        message?.constructor?.name === "AIMessage";

      if (!isAIMessageChunk) continue;

      // 类型断言为 AIMessageChunkLike
      const aiMessage = message as AIMessageChunkLike;

      // 更新当前消息 ID
      if (aiMessage.id && aiMessage.id !== currentAIMessageId) {
        // 新消息开始前，先发送之前累积的工具调用
        if (toolCallAccumulators.size > 0 && currentAIMessageId) {
          const completedToolCalls =
            buildCompletedToolCalls(toolCallAccumulators);
          yield {
            type: "ai",
            data: {
              id: currentAIMessageId,
              content: "",
              tool_calls: completedToolCalls,
            },
          };
          toolCallAccumulators.clear();
        }
        currentAIMessageId = aiMessage.id;
      }

      // 处理工具调用片段 (tool_call_chunks)
      const toolCallChunks = aiMessage.tool_call_chunks;
      if (toolCallChunks && toolCallChunks.length > 0) {
        for (const tchunk of toolCallChunks) {
          const { index, id, name, args } = tchunk;
          const idx = index ?? 0;

          if (!toolCallAccumulators.has(idx)) {
            toolCallAccumulators.set(idx, {
              id: id || "",
              name: name || "",
              args: args || "",
            });
          } else {
            const acc = toolCallAccumulators.get(idx)!;
            if (id) acc.id = id;
            if (name) acc.name += name;
            acc.args += args || "";
          }
        }
        // 不在这里 yield，等累积完成后再发送
        continue;
      }

      // 检查是否有完整的工具调用 (非流式情况)
      const toolCalls = aiMessage.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        yield {
          type: "ai",
          data: {
            id: aiMessage.id || Date.now().toString(),
            content: "",
            tool_calls: toolCalls,
          },
        };
        continue;
      }

      // 处理普通文本内容 - 使用缓冲区确保代码块完整
      const chunkContent = extractContent(aiMessage);
      if (chunkContent) {
        contentBuffer += chunkContent;

        // 找到安全的断点位置
        const safeBreakPoint = findSafeBreakPoint(contentBuffer);

        // 如果有可以安全发送的内容
        if (safeBreakPoint > lastSentIndex) {
          const contentToSend = contentBuffer.substring(
            lastSentIndex,
            safeBreakPoint
          );
          if (contentToSend.trim()) {
            yield {
              type: "ai",
              data: {
                id: currentAIMessageId || Date.now().toString(),
                content: contentToSend,
              },
            };
          }
          lastSentIndex = safeBreakPoint;
        }
      }
    }

    // 流结束后，发送缓冲区中剩余的内容
    if (contentBuffer.length > lastSentIndex) {
      const remainingContent = contentBuffer.substring(lastSentIndex);
      if (remainingContent.trim()) {
        yield {
          type: "ai",
          data: {
            id: currentAIMessageId || Date.now().toString(),
            content: remainingContent,
          },
        };
      }
    }

    // 流结束后，发送最后累积的工具调用（如果有）
    if (toolCallAccumulators.size > 0) {
      const completedToolCalls = buildCompletedToolCalls(toolCallAccumulators);
      yield {
        type: "ai",
        data: {
          id: currentAIMessageId || Date.now().toString(),
          content: "",
          tool_calls: completedToolCalls,
        },
      };
    }
  }

  // 辅助函数：构建完整的工具调用数组
  function buildCompletedToolCalls(
    accumulators: Map<number, { id: string; name: string; args: string }>
  ) {
    return Array.from(accumulators.values()).map((acc) => {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(acc.args);
      } catch {
        parsedArgs = { raw: acc.args };
      }
      return {
        id: acc.id,
        name: acc.name,
        args: parsedArgs,
        type: "tool_call" as const,
      };
    });
  }

  // 辅助函数：从消息中提取文本内容
  function extractContent(message: BaseMessage): string {
    if (typeof message.content === "string") {
      return message.content;
    } else if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === "object" && "text" in item
            ? String(item.text)
            : ""
        )
        .join("");
    }
    return String(message.content || "");
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
