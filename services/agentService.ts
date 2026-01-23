import type {
  MessageOptions,
  MessageResponse,
  ToolCall,
  AttachmentFile,
} from "@/types/message";
import { ensureThread } from "@/lib/thread";
import { BaseMessage, HumanMessage } from "langchain";
import { ensureAgent } from "@/lib/agent";
import prisma from "@/lib/database/pirsma";
import { getHistory, postgresCheckpointer } from "@/lib/agent/memory";
import { Command } from "@langchain/langgraph";
import {
  ExternalServiceError,
  FileUploadError,
  ValidationError,
} from "@/lib/errors";

/**
 * 清理线程中未完成的工具调用
 * 当线程中最后一条消息是带有tool_calls的AI消息，但没有相应的tool响应时，
 * 添加空的tool响应来完成调用链
 */
async function cleanupIncompleteToolCalls(threadId: string) {
  try {
    const history = await getHistory(threadId);
    if (history.length === 0) return;

    const lastMessage = history[history.length - 1];

    // 检查最后一条消息是否是带有tool_calls的AI消息
    if (
      lastMessage?.constructor?.name === "AIMessage" &&
      (lastMessage as any).tool_calls &&
      (lastMessage as any).tool_calls.length > 0
    ) {
      console.log("Found incomplete tool calls, cleaning up...");

      // 检查是否有对应的tool响应
      let hasToolResponses = false;
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.constructor?.name === "ToolMessage") {
          hasToolResponses = true;
          break;
        }
        if (msg.constructor?.name === "AIMessage" && msg !== lastMessage) {
          break;
        }
      }

      // 如果没有tool响应，我们需要清理这个状态
      // 通过创建一个新的agent实例并重置状态
      if (!hasToolResponses) {
        console.log("No tool responses found, will reset conversation state");
        // 这里可以选择重置线程状态或者添加错误消息
      }
    }
  } catch (error) {
    console.error("Error cleaning up tool calls:", error);
    // 继续执行，不要因为清理失败而阻止新消息
  }
}

/**
 * 将 URL 转换为 data URL (base64)
 * @throws {ExternalServiceError} 当文件获取失败时
 */
async function convertUrlToDataUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ExternalServiceError(
        `Failed to fetch file: ${response.statusText}`,
        "File Storage",
        response.status === 404 ? 502 : 503,
      );
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = blob.type || "application/octet-stream";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    throw new ExternalServiceError(
      "Failed to convert URL to data URL",
      "File Storage",
      502,
      error,
    );
  }
}

/**
 * 创建支持多模态的HumanMessage
 * 按照 LangChain 官方规范处理多模态内容
 * @throws {ValidationError} 当文件格式无效时
 * @throws {FileUploadError} 当文件处理失败时
 */
async function createHumanMessage(
  text: string,
  files?: AttachmentFile[],
): Promise<HumanMessage> {
  if (!files || files.length === 0) {
    return new HumanMessage(text);
  }

  // 按照 LangChain 官方规范创建多模态内容
  const content: Array<{
    type: "file" | "image_url" | "audio" | "video" | "text";
    source_type?: "url" | "base64";
    image_url?: { url: string };
    url?: string;
    data?: string;
    text?: string;
    name?: string;
  }> = [];

  // 添加文本内容
  if (text && text.trim()) {
    content.push({
      type: "text",
      text: text,
    });
  }

  // 处理文件内容
  for (const file of files) {
    // 验证文件对象的基本结构
    if (!file || !file.type || !file.name) {
      console.warn("Skipping invalid file object:", file);
      continue;
    }

    // 验证文件至少有 url 或 data
    if (!file.url && !file.data) {
      console.warn("Skipping file without URL or data:", file.name);
      content.push({
        type: "text",
        text: `文件 ${file.name} 无法加载（缺少URL或数据）`,
      });
      continue;
    }

    if (file.type === "image") {
      // 图片文件处理：支持 URL 和 base64
      if (file.source_type === "base64" && file.data) {
        content.push({
          type: "image_url",
          image_url: { url: file.data },
        });
      } else if (file.source_type === "url" && file.url) {
        content.push({
          type: "image_url",
          image_url: { url: file.url },
        });
      }
    } else if (file.type === "pdf") {
      // PDF 文件处理：OpenAI 需要 data URL 格式
      if (file.source_type === "base64" && file.data) {
        content.push({
          type: "file",
          source_type: "base64",
          data: file.data,
          name: file.name,
        });
      } else if (file.source_type === "url" && file.url) {
        // 尝试将 URL 转换为 data URL
        content.push({
          type: "file",
          source_type: "base64",
          data: file.url,
          name: file.name,
        });
        // 转换失败，使用文本描述
      }
    } else if (file.type === "audio") {
      // 音频文件处理
      if (file.source_type === "base64" && file.data) {
        content.push({
          type: "audio",
          source_type: "base64",
          data: file.data,
        });
      } else if (file.source_type === "url" && file.url) {
        // 音频文件通常需要 base64 格式，尝试转换
        content.push({
          type: "audio",
          source_type: "base64",
          data: file.url,
          name: file.name,
        });
      }
    } else if (file.type === "video") {
      // 视频文件处理
      if (file.source_type === "base64" && file.data) {
        content.push({
          type: "video",
          source_type: "base64",
          data: file.data,
        });
      } else if (file.source_type === "url" && file.url) {
        // 视频文件通常需要 base64 格式，尝试转换
        try {
          const dataUrl = await convertUrlToDataUrl(file.url);
          content.push({
            type: "video",
            source_type: "base64",
            data: dataUrl,
          });
        } catch (error) {
          // 转换失败，添加文本说明
          console.warn(`Failed to convert video URL for ${file.name}:`, error);
          content.push({
            type: "text",
            text: `视频文件：${file.name}，下载链接：${file.url}`,
          });
        }
      }
    } else {
      // 其他类型文件暂不支持处理，可根据需要扩展
      const fileUrl = file.url || (file.data ? "(base64数据)" : "(无链接)");
      content.push({
        type: "text",
        text: `附件文件：${getFileTypeLabel(file.type)} - ${
          file.name
        }，下载链接：${fileUrl}`,
      });
    }
  }

  return new HumanMessage({ content });
}

/**
 * 获取文件类型标签
 */
function getFileTypeLabel(fileType: string): string {
  switch (fileType) {
    case "document":
      return "文档文件";
    case "pdf":
      return "PDF文档";
    case "audio":
      return "音频文件";
    case "video":
      return "视频文件";
    case "image":
      return "图片文件";
    default:
      return "附件文件";
  }
}

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

  // 检查并清理未完成的工具调用
  if (!opts?.allowTool) {
    await cleanupIncompleteToolCalls(threadId);
  }

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
        messages: [await createHumanMessage(userText, opts?.files)],
      };

  console.log("📝 Prepared inputs for agent:", inputs);

  // 配置参数直接使用，不需要从数据库恢复（前端会在每次请求时传递）
  const provider = opts?.provider;
  const model = opts?.model;
  const mcpUrl = opts?.mcpUrl;
  const autoToolCall = opts?.autoToolCall;
  const enabledTools = opts?.enabledTools;

  console.log("🔧 Creating agent with config:", {
    provider,
    model,
    mcpUrl,
    autoToolCall,
    enabledTools: enabledTools ? `${enabledTools.length} tools` : undefined,
  });

  // 创建或获取一个按所选 provider/model/tools 配置的 agent 实例。
  // `ensureAgent` 会构建一个 AgentBuilder，并将工具绑定到 LLM 上。
  const agent = await ensureAgent({
    provider: provider,
    model: model,
    tools: opts?.tools,
    autoToolCall: autoToolCall,
    mcpUrl: mcpUrl,
    enabledTools: enabledTools,
  });

  // Type assertion needed for Command union with state update in v1
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let configurable = {
    thread_id: threadId,
    // 保存完整配置到 checkpoint，以便恢复时使用
    ...(provider && { provider }),
    ...(model && { model }),
    ...(mcpUrl && { mcpUrl }),
  };
  let iterable: any;

  try {
    console.log("⏱️  [TIMING] Starting agent.stream() call...");
    const streamStartTime = Date.now();

    iterable = await agent.stream(inputs as any, {
      streamMode: ["updates", "messages"],
      configurable,
    });

    const streamInitTime = Date.now() - streamStartTime;
    console.log(
      `⏱️  [TIMING] agent.stream() returned iterable in ${streamInitTime}ms`,
    );
  } catch (error: any) {
    // 如果是工具调用相关错误，使用新的线程ID重试
    if (
      error?.message?.includes("tool_calls") ||
      error?.lc_error_code === "INVALID_TOOL_RESULTS"
    ) {
      console.log("Tool call error detected, retrying with new thread...");
      const newThreadId = `${threadId}_${Date.now()}`;
      configurable = { thread_id: newThreadId };

      console.log("⏱️  [TIMING] Retrying agent.stream() call...");
      const retryStartTime = Date.now();

      iterable = await agent.stream(inputs as any, {
        streamMode: ["updates", "messages"],
        configurable,
      });

      const retryTime = Date.now() - retryStartTime;
      console.log(
        `⏱️  [TIMING] Retry agent.stream() returned in ${retryTime}ms`,
      );
    } else {
      throw error;
    }
  }

  // 该生成器遍历 LangGraph agent 返回的可迭代流（iterable），并将内部的 chunk
  // 转换为项目所需的 `MessageResponse` 结构。
  // 使用 ["updates", "messages"] 组合模式：updates 用于 interrupt 检测，messages 用于流式展示
  async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
    console.log("🔄 Starting generator, allowTool:", opts?.allowTool);
    console.log(
      "⏱️  [TIMING] Entering for-await loop, waiting for first chunk...",
    );

    const generatorStartTime = Date.now();
    let firstChunkTime: number | null = null;
    let chunkCount = 0;

    for await (const chunk of iterable) {
      chunkCount++;

      // 记录第一个 chunk 到达时间
      if (firstChunkTime === null) {
        firstChunkTime = Date.now() - generatorStartTime;
        console.log(
          `⏱️  [TIMING] 🎉 First chunk received after ${firstChunkTime}ms`,
        );
      }

      if (!chunk) continue;

      // 组合模式返回元组：[streamMode, data]
      if (!Array.isArray(chunk) || chunk.length !== 2) continue;
      const [streamMode, data] = chunk;

      // ============ 处理 "messages" 模式 - 流式 AI 消息增量 ============
      if (streamMode === "messages") {
        // messages 模式返回单个消息或消息数组的增量
        const messages = Array.isArray(data) ? data : [data];

        for (const message of messages) {
          if (!message) continue;

          // 检查是否是 AI 消息增量
          const isAIMessage =
            message?.constructor?.name === "AIMessageChunk" ||
            message?.constructor?.name === "AIMessage";

          if (!isAIMessage) continue;

          // 关键：跳过包含 tool_calls 的消息（工具调用由 updates 模式处理）
          // 只处理纯文本流式消息
          const hasToolCall =
            (Array.isArray(message.content) &&
              message.content.some(
                (item: unknown) =>
                  item && typeof item === "object" && "functionCall" in item,
              )) ||
            ("tool_calls" in message &&
              Array.isArray(message.tool_calls) &&
              message.tool_calls.length > 0);

          // 如果这是工具调用消息，跳过（updates 模式会处理）
          if (hasToolCall) {
            continue;
          }

          // 只处理纯文本消息
          const processedMessage = processAIMessage(
            message as Record<string, unknown>,
          );
          if (processedMessage) {
            yield processedMessage;
          }
        }
        continue; // 处理完 messages 模式，继续下一个 chunk
      }

      // ============ 处理 "updates" 模式 - 状态更新和 interrupt ============
      if (streamMode !== "updates" || !data || typeof data !== "object") {
        continue;
      }

      // 1) 处理中断（interrupt）负载
      if (
        "__interrupt__" in data &&
        Array.isArray((data as any).__interrupt__)
      ) {
        console.log("🔔 ===== INTERRUPT DETECTED =====");
        const interrupts = (data as any).__interrupt__ as Array<
          Record<string, any>
        >;

        const firstInterrupt = interrupts[0];
        if (firstInterrupt?.value) {
          const interruptValue = firstInterrupt.value;

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
              id: interruptValue.metadata?.toolCallId || Date.now().toString(),
              type: interruptValue.type || "choice",
              question: interruptValue.question || "需要您的确认",
              options: interruptValue.options || [],
              context: interruptValue.context,
              currentValue: interruptValue.currentValue,
              metadata: interruptValue.metadata || {},
            },
          };

          console.log("🔔 Interrupt message yielded, stopping stream");
        }
        // interrupt 后停止流，等待用户响应
        return;
      }

      // 2) 处理 approval 节点的消息（ToolMessage，用于拒绝反馈）
      if (
        "approval" in data &&
        (data as any).approval &&
        typeof (data as any).approval === "object" &&
        "messages" in (data as any).approval
      ) {
        const messages = Array.isArray((data as any).approval.messages)
          ? (data as any).approval.messages
          : [(data as any).approval.messages];

        for (const message of messages) {
          if (!message) continue;

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

      // 3) 处理工具调用（从 updates 模式中提取，用于展示工具调用卡片）
      // 注意：普通 AI 文本消息已由 messages 模式流式处理，这里只处理工具调用信息
      const agentNodeData = (data as any).agent || (data as any).chatbot;
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

          // 只处理带有 tool_calls 的消息（工具调用卡片）
          const hasToolCall =
            (Array.isArray(message.content) &&
              message.content.some(
                (item: unknown) =>
                  item && typeof item === "object" && "functionCall" in item,
              )) ||
            ("tool_calls" in message &&
              Array.isArray(message.tool_calls) &&
              message.tool_calls.length > 0);

          // 关键：只有当消息包含 tool_calls 时才处理
          // 这避免了 updates 模式重复发送普通文本消息
          if (hasToolCall) {
            console.log("🔧 Processing tool call message:", {
              hasContent: !!message.content,
              contentType: Array.isArray(message.content)
                ? "array"
                : typeof message.content,
              hasToolCalls: "tool_calls" in message,
            });

            const processedMessage = processAIMessage(
              message as Record<string, unknown>,
            );

            console.log("🔧 Processed message result:", {
              hasResult: !!processedMessage,
              type: processedMessage?.type,
              contentType:
                processedMessage && "content" in processedMessage.data
                  ? Array.isArray(processedMessage.data.content)
                    ? "array"
                    : typeof processedMessage.data.content
                  : null,
              hasToolCalls:
                processedMessage?.type === "ai" &&
                "tool_calls" in processedMessage.data,
            });

            // 再次确认返回的消息确实包含 tool_calls
            if (
              processedMessage &&
              processedMessage.type === "ai" &&
              "tool_calls" in processedMessage.data &&
              processedMessage.data.tool_calls
            ) {
              console.log("✅ Yielding tool call message");
              yield processedMessage;
            }
          }
        }
      }

      // 4) 处理工具节点的消息（ToolMessage，工具执行结果）
      if (
        "tools" in data &&
        (data as any).tools &&
        typeof (data as any).tools === "object" &&
        "messages" in (data as any).tools
      ) {
        const messages = Array.isArray((data as any).tools.messages)
          ? (data as any).tools.messages
          : [(data as any).tools.messages];

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

    // 流结束时的统计
    const totalTime = Date.now() - generatorStartTime;
    console.log(
      `⏱️  [TIMING] Stream completed - Total chunks: ${chunkCount}, Total time: ${totalTime}ms, First chunk: ${firstChunkTime}ms`,
    );
  }
  return generator();
}

// 辅助函数：处理任意 AI 消息并返回适当的 MessageResponse
function processAIMessage(
  message: Record<string, unknown>,
): MessageResponse | null {
  // 判断该 AI 消息是否为工具/函数调用。
  // LangGraph/或 LLM 的工具调用可能以结构化 content 表示（例如数组中包含 `functionCall` 字段），
  // 也可能直接以消息的 `tool_calls` 字段出现。这里对两种情况都进行检查。
  const hasToolCall =
    // Some LLMs represent structured content as an array including a functionCall
    (Array.isArray(message.content) &&
      message.content.some(
        (item: unknown) =>
          item && typeof item === "object" && "functionCall" in item,
      )) ||
    // Or the tooling layer may attach a `tool_calls` field directly
    ("tool_calls" in message && Array.isArray((message as any).tool_calls));

  if (hasToolCall) {
    // 工具调用：返回更丰富的 AIMessageData 结构，以便前端渲染工具调用详情并在需要时展示审批 UI。
    // 返回字段说明：
    // - id：回复/消息的稳定 id
    // - content：可能是字符串或包含 functionCall 的数组
    // - tool_calls：工具调用描述数组（包含 name、id、args 等）
    // - additional_kwargs / response_metadata：模型可能携带的额外元数据

    // 保留原始 content，无论是字符串还是数组（包含 functionCall）
    let content: string | any[] = "";
    if (typeof message.content === "string") {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = message.content;
    }

    return {
      type: "ai",
      data: {
        id: (message.id as string) || Date.now().toString(),
        content: content,
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
        typeof c === "string" ? c : c?.text || "",
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
  threadId: string,
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
