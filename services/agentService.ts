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
import { Command } from "@langchain/langgraph";

/**
 * Agent 流式响应服务
 *
 * 提供 `streamResponse` 函数，返回一个异步生成器（async generator），用于产生增量的
 * `MessageResponse` 对象，适合在服务端通过 SSE 等方式逐块发送给客户端。
 *
 * 流程摘要：
 *  1. 确保线程存在（若不存在则创建线程记录）。
 *  2. 准备输入：如果是针对已暂停的工具调用则使用 resume 的 `Command`，否则使用 `HumanMessage`。
 *  3. 创建或获取配置好的 agent（包含 provider/model/tools 等选项）。
 *  4. 打开 LangGraph agent 的流式输出并遍历返回的 chunk。
 *  5. 处理特殊的中断（interrupt）负载（如工具审批）以及常规的 agent 更新。
 *  6. 将 LangGraph / AI 消息对象转换为项目使用的 `MessageResponse` 结构，供前端渲染助手文本、工具调用和工具消息。
 */
export async function streamResponse(params: {
  threadId: string;
  userText: string;
  opts?: MessageOptions;
}) {
  const { threadId, userText, opts } = params;

  // 确保线程在数据库中存在，并初始化必要的元数据/状态。
  // 这样可以让 agent 将流式响应与持久化的线程关联起来。
  await ensureThread(threadId, userText);

  // 如果本次请求是为恢复之前被暂停的工具调用（resume），则构造一个带有 resume
  // action（continue/update）的 `Command`。否则使用普通的 `HumanMessage` 开始新的生成。
  const inputs = opts?.allowTool
    ? new Command({
        resume:
          opts.allowTool === "allow"
            ? // 批准：继续执行工具
              {
                action: "continue",
                data: "",
              }
            : // 拒绝：提供反馈数据，告知用户拒绝了工具调用
              {
                action: "feedback",
                data: "用户拒绝了工具调用",
              },
      })
    : {
        messages: [new HumanMessage(userText)],
      };

  // 创建或获取一个按所选 provider/model/tools 配置的 agent 实例。
  // `ensureAgent` 会构建一个 AgentBuilder，并将工具绑定到 LLM 上。
  const agent = await ensureAgent({
    provider: opts?.provider,
    model: opts?.model,
    tools: opts?.tools,
    approveAllTools: opts?.approveAllTools,
  });

  // Type assertion needed for Command union with state update in v1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iterable = await agent.stream(inputs as any, {
    streamMode: ["updates"],
    configurable: { thread_id: threadId },
  });

  // 该生成器遍历 LangGraph agent 返回的可迭代流（iterable），并将内部的 chunk
  // 元组转换为项目所需的 `MessageResponse` 结构。
  async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
    console.log("🔄 Starting generator, allowTool:", opts?.allowTool);
    for await (const chunk of iterable) {
      if (!chunk) continue;
      // 调试信息：打印原始 chunk 负载，便于排查流式行为
      console.log("🚀 ~ generator ~ chunk:", chunk);

      // LangGraph 返回的 chunk 通常为二元元组形式：[type, data]
      if (!Array.isArray(chunk) || chunk.length !== 2) continue;
      const [chunkType, chunkData] = chunk;

      // 仅处理类型为 "updates" 的 chunk，忽略其他类型（如 "final" 等）
      if (
        chunkType !== "updates" ||
        !chunkData ||
        typeof chunkData !== "object"
      )
        continue;

      // 1) 处理中断（interrupt）负载（工具审批请求）。当状态机暂停等待人工确认时，
      //    LangGraph 会发出 `__interrupt__` 条目。这里把它转换为标准的 interrupt 类型消息，
      //    以便前端展示审批 UI。
      if (
        "__interrupt__" in chunkData &&
        Array.isArray((chunkData as any).__interrupt__)
      ) {
        console.log("🔔 ===== INTERRUPT DETECTED =====");
        const interrupts = (chunkData as any).__interrupt__ as Array<
          Record<string, any>
        >;

        for (const intr of interrupts) {
          const interruptValue = intr?.value;
          console.log(
            "🔔 Interrupt value:",
            JSON.stringify(interruptValue, null, 2)
          );

          if (interruptValue) {
            /**
             * 前端中断审批示例文案（参考）：
             *
             * - 标题："工具调用需审批"
             * - 描述："助手将要调用工具 '<toolName>'，参数如下。请审核并选择继续或拒绝。"
             * - 展示的 payload：
             *   {
             *     id: toolCallId,
             *     type: "choice",
             *     question: "...",
             *     options: [...]
             *   }
             * - 操作：
             *   [批准] -> 向后端发送 resume，请求参数 `allowTool='allow'`
             *   [拒绝] -> 向后端发送 resume，请求参数 `allowTool='deny'`
             *
             * 客户端使用 SSE 恢复调用示例：
             *   createMessageStream(threadId, "", { allowTool: 'allow' })
             */
            yield {
              type: "interrupt",
              data: {
                id:
                  interruptValue.metadata?.toolCallId || Date.now().toString(),
                type: interruptValue.type || "choice",
                question: interruptValue.question || "需要您的确认",
                options: interruptValue.options || [],
                context: interruptValue.context,
                currentValue: interruptValue.currentValue,
                metadata: interruptValue.metadata || {},
              },
            };

            console.log("🔔 Interrupt message yielded, stopping stream");
            // interrupt 后停止流，等待用户响应
            break;
          }
        }
        // 如果检测到 interrupt，跳过后续的消息处理，等待下一个 chunk
        continue;
      }

      // 2) 处理 approval 节点的消息（ToolMessage，用于拒绝反馈）
      if (
        "approval" in (chunkData as any) &&
        (chunkData as any).approval &&
        typeof (chunkData as any).approval === "object" &&
        "messages" in (chunkData as any).approval
      ) {
        const messages = Array.isArray((chunkData as any).approval.messages)
          ? (chunkData as any).approval.messages
          : [(chunkData as any).approval.messages];

        for (const message of messages) {
          if (!message) continue;

          // 处理 approval 节点返回的 ToolMessage（拒绝时）
          const isToolMessage = message?.constructor?.name === "ToolMessage";
          if (isToolMessage) {
            const content =
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

            yield {
              type: "tool",
              data: {
                id: message.id || Date.now().toString(),
                content,
                status: "rejected",
                tool_call_id: (message as any).tool_call_id || "",
                name: (message as any).name || "",
              },
            };
          }
        }
      }

      // 3) 处理常规的 agent 更新消息（包含 AI 消息块）。
      // 注意：节点名称可能是 "agent" 或 "chatbot"，取决于图的构建方式
      const agentNodeData =
        (chunkData as any).agent || (chunkData as any).chatbot;
      if (
        agentNodeData &&
        typeof agentNodeData === "object" &&
        "messages" in agentNodeData
      ) {
        const messages = Array.isArray(agentNodeData.messages)
          ? agentNodeData.messages
          : [agentNodeData.messages];

        for (const message of messages) {
          if (!message) continue;

          // 仅处理实际的 AI 消息（可能是分块的 AIMessageChunk 或最终的 AIMessage 实例）
          const isAIMessage =
            message?.constructor?.name === "AIMessageChunk" ||
            message?.constructor?.name === "AIMessage";

          if (!isAIMessage) continue;

          const processedMessage = processAIMessage(
            message as Record<string, unknown>
          );
          if (processedMessage) {
            yield processedMessage;
          }
        }
      }

      // 4) 处理工具节点的消息（ToolMessage，工具执行结果）
      if (
        "tools" in (chunkData as any) &&
        (chunkData as any).tools &&
        typeof (chunkData as any).tools === "object" &&
        "messages" in (chunkData as any).tools
      ) {
        const messages = Array.isArray((chunkData as any).tools.messages)
          ? (chunkData as any).tools.messages
          : [(chunkData as any).tools.messages];

        for (const message of messages) {
          if (!message) continue;

          // 处理工具消息
          const isToolMessage = message?.constructor?.name === "ToolMessage";
          if (isToolMessage) {
            const content =
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content);

            yield {
              type: "tool",
              data: {
                id: message.id || Date.now().toString(),
                content,
                status: "success",
                tool_call_id: (message as any).tool_call_id || "",
                name: (message as any).name || "",
              },
            };
          }
        }
      }
    }
  }
  return generator();
}

// 辅助函数：处理任意 AI 消息并返回适当的 MessageResponse
function processAIMessage(
  message: Record<string, unknown>
): MessageResponse | null {
  // 判断该 AI 消息是否为工具/函数调用。
  // LangGraph/或 LLM 的工具调用可能以结构化 content 表示（例如数组中包含 `functionCall` 字段），
  // 也可能直接以消息的 `tool_calls` 字段出现。这里对两种情况都进行检查。
  const hasToolCall =
    // Some LLMs represent structured content as an array including a functionCall
    (Array.isArray(message.content) &&
      message.content.some(
        (item: unknown) =>
          item && typeof item === "object" && "functionCall" in item
      )) ||
    // Or the tooling layer may attach a `tool_calls` field directly
    ("tool_calls" in message && Array.isArray((message as any).tool_calls));

  if (hasToolCall) {
    // 工具调用：返回更丰富的 AIMessageData 结构，以便前端渲染工具调用详情并在需要时展示审批 UI。
    // 返回字段说明：
    // - id：回复/消息的稳定 id
    // - content：若存在则为文本内容（可能为空）
    // - tool_calls：工具调用描述数组（包含 name、id、args 等）
    // - additional_kwargs / response_metadata：模型可能携带的额外元数据
    return {
      type: "ai",
      data: {
        id: (message.id as string) || Date.now().toString(),
        content: typeof message.content === "string" ? message.content : "",
        tool_calls: (message.tool_calls as ToolCall[]) || undefined,
        additional_kwargs:
          (message.additional_kwargs as Record<string, unknown>) || undefined,
        response_metadata:
          (message.response_metadata as Record<string, unknown>) || undefined,
      },
    };
  }

  // 非工具的 AI 内容：提取可读文本。不同的 LLM/运行时可能将文本表示为字符串或
  // 内容块数组，这里将两种情况归一化为一个字符串供前端使用。
  let text = "";
  if (typeof message.content === "string") {
    text = message.content;
  } else if (Array.isArray(message.content)) {
    text = message.content
      .map((c: string | { text?: string }) =>
        typeof c === "string" ? c : c?.text || ""
      )
      .join("");
  } else {
    text = String(message.content ?? "");
  }

  // 如果存在有意义的文本，则以前端期望的轻量型 BasicMessageData 形式返回。
  // 对空或仅包含空白的内容则忽略返回。
  if (text.trim()) {
    return {
      type: "ai",
      data: {
        id: (message.id as string) || Date.now().toString(),
        content: text,
      },
    };
  }

  // If there's nothing meaningful to return, signal null so caller ignores it.
  return null;
}

export async function fetchThreadHistory(
  threadId: string
): Promise<MessageResponse[]> {
  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) return [];
  try {
    const history = await getHistory(threadId);
    console.log("🚀 ~ fetchThreadHistory ~ history:", history);
    return history.map((msg: BaseMessage) => msg.toDict() as MessageResponse);
  } catch (e) {
    console.error("fetchThreadHistory error", e);
    return [];
  }
}
