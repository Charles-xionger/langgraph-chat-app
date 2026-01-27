export const maxDuration = 120;
export const dynamic = "force-dynamic";

import { streamResponse } from "@/services/agentService";
import { MessageResponse } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";
import { ValidationError, formatStreamError } from "@/lib/errors";
import { warmupMCPTools } from "@/lib/agent";
import { auth } from "@/lib/auth";

// 流式超时时间 (120秒) - 给复杂的工具调用链和 MCP 工具更多时间
const STREAM_TIMEOUT = 120000; // 120000ms = 120s

export async function GET(request: NextRequest) {
  // 验证用户认证
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 提取 userId 以确保类型安全
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const userContent = searchParams.get("content");
  const provider = searchParams.get("provider");
  const model = searchParams.get("model");
  const allowTool = searchParams.get("allowTool") as "allow" | "deny" | null;
  const mcpUrl = searchParams.get("mcpUrl");
  const autoToolCall = searchParams.get("autoToolCall") === "true";
  const enabledToolsParam = searchParams.get("enabledTools");
  const enabledTools = enabledToolsParam
    ? JSON.parse(enabledToolsParam)
    : undefined;

  console.log("Stream GET request received:", {
    threadId,
    userContent,
    provider,
    model,
    allowTool,
    mcpUrl,
    autoToolCall,
    enabledTools: enabledTools
      ? `${enabledTools.length} tools`
      : "all tools (no filter)",
    timeout: `${STREAM_TIMEOUT}ms (${STREAM_TIMEOUT / 1000}s)`,
  });

  // 如果请求中包含 MCP URL，异步预热（不阻塞当前请求）
  if (mcpUrl) {
    warmupMCPTools(mcpUrl);
  }

  // 参数验证
  if (!threadId || typeof userContent !== "string") {
    throw new ValidationError("Invalid request parameters", {
      threadId: !threadId ? ["threadId is required"] : [],
      content:
        typeof userContent !== "string" ? ["content must be a string"] : [],
    });
  }

  // 1. 定义编码器，用于将字符串转换为 Uint8Array
  const encoder = new TextEncoder();

  // 用于中断流的控制器
  const abortController = new AbortController();
  let isAborted = false;

  // 超时控制
  const timeoutId = setTimeout(() => {
    console.error(
      `⏱️ ❌ Stream timeout after ${STREAM_TIMEOUT}ms (${STREAM_TIMEOUT / 1000}s)`,
    );
    console.error("GET Request timeout - Details:", {
      threadId,
      provider,
      model,
      autoToolCall,
      mcpUrl,
    });
    isAborted = true;
    abortController.abort();
  }, STREAM_TIMEOUT);

  // 2. 创建一个可读流
  const stream = new ReadableStream<Uint8Array>({
    // 当流开始时调用
    start(controller) {
      // 定义发送数据的辅助函数
      const send = (data: MessageResponse) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // 流已关闭，忽略
        }
      };

      // Initial comment to establish stream
      // 初始化连接时发送一个注释，防止某些浏览器超时
      controller.enqueue(encoder.encode(`: connected\n\n`));

      // 3. 调用 agentService 的流式接口
      (async () => {
        try {
          const iterable = await streamResponse({
            threadId,
            userId,
            userText: userContent,
            opts: {
              provider: provider || undefined,
              model: model || undefined,
              allowTool: allowTool || undefined,
              mcpUrl: mcpUrl || undefined,
              autoToolCall,
              enabledTools: enabledTools,
            },
          });

          for await (const chunk of iterable) {
            // 检查是否已中断
            if (isAborted || abortController.signal.aborted) {
              break;
            }
            // 发送 ai、tool 或 interrupt 类型的消息
            if (
              chunk.type === "ai" ||
              chunk.type === "tool" ||
              chunk.type === "interrupt"
            ) {
              send(chunk);
              // 如果是 interrupt，暂停流，等待恢复命令
              if (chunk.type === "interrupt") {
                break;
              }
            }
          }

          if (!isAborted) {
            // 流结束时发送一个特殊的结束信号
            controller.enqueue(encoder.encode("event: done\n"));
            controller.enqueue(encoder.encode("data: {}\n\n"));
          }
        } catch (error) {
          if (!isAborted) {
            controller.enqueue(encoder.encode("event: error\n"));
            controller.enqueue(
              encoder.encode(`data: ${formatStreamError(error, threadId)}\n\n`),
            );
          }
        } finally {
          // 清理超时控制器
          clearTimeout(timeoutId);
          try {
            controller.close();
          } catch {
            // Stream already closed
          }
        }
      })();
    },

    cancel() {
      clearTimeout(timeoutId);
      isAborted = true;
      abortController.abort();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8", // 设置内容类型为事件流
      "Cache-Control": "no-cache, no-transform", // 禁用缓存和转换
      Connection: "keep-alive", // 保持连接活跃
      "X-Accel-Buffering": "no", // 关闭 Nginx 的响应缓冲
    },
  });
}

// POST 接口 - 支持文件上传的消息请求和恢复被 interrupt 暂停的执行
export async function POST(request: NextRequest) {
  // 验证用户认证
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 提取 userId 以确保类型安全
  const userId = session.user.id;

  const body = await request.json();
  const {
    threadId,
    content,
    provider,
    model,
    allowTool,
    files,
    value,
    mcpUrl,
    autoToolCall,
    enabledTools,
  } = body;

  // 参数验证
  if (!threadId) {
    throw new ValidationError("threadId is required", {
      threadId: ["threadId is required"],
    });
  }

  // 如果是恢复请求（有 value 参数），使用原有逻辑
  if (value !== undefined) {
    return handleInterruptResume(threadId, value);
  }

  // 新消息请求处理逻辑
  if (typeof content !== "string") {
    throw new ValidationError("Invalid request body", {
      content: ["content must be a string"],
    });
  }

  console.log("Stream POST request received:", {
    threadId,
    content,
    provider,
    model,
    allowTool,
    files: files?.length || 0,
    mcpUrl,
    autoToolCall,
    enabledTools: enabledTools
      ? `${enabledTools.length} tools`
      : "all tools (no filter)",
    timeout: `${STREAM_TIMEOUT}ms (${STREAM_TIMEOUT / 1000}s)`,
  });

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let isAborted = false;

  // 超时控制
  const timeoutId = setTimeout(() => {
    console.error(
      `⏱️ ❌ Stream timeout after ${STREAM_TIMEOUT}ms (${STREAM_TIMEOUT / 1000}s)`,
    );
    console.error("POST Request timeout - Details:", {
      threadId,
      provider,
      model,
      autoToolCall,
      hasFiles: !!files,
    });
    isAborted = true;
    abortController.abort();
  }, STREAM_TIMEOUT);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: MessageResponse) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // 流已关闭，忽略
        }
      };

      controller.enqueue(encoder.encode(`: connected\n\n`));

      try {
        const iterable = await streamResponse({
          threadId,
          userId,
          userText: content,
          opts: {
            provider,
            model,
            allowTool,
            files,
            mcpUrl,
            autoToolCall,
            enabledTools,
          },
        });

        for await (const chunk of iterable) {
          // 检查是否已中断
          if (isAborted || abortController.signal.aborted) {
            break;
          }
          // 发送 ai、tool 或 interrupt 类型的消息
          if (
            chunk.type === "ai" ||
            chunk.type === "tool" ||
            chunk.type === "interrupt"
          ) {
            send(chunk);
            // 如果是 interrupt，暂停流，等待恢复命令
            if (chunk.type === "interrupt") {
              break;
            }
          }
        }

        if (!isAborted) {
          controller.enqueue(encoder.encode("event: done\n"));
          controller.enqueue(encoder.encode("data: {}\n\n"));
        }
      } catch (error) {
        console.error("Stream error:", error);
        if (!isAborted) {
          controller.enqueue(encoder.encode("event: error\n"));
          controller.enqueue(
            encoder.encode(`data: ${formatStreamError(error, threadId)}\n\n`),
          );
        }
      } finally {
        clearTimeout(timeoutId);
        try {
          controller.close();
        } catch {
          // 流已关闭
        }
      }
    },

    cancel() {
      clearTimeout(timeoutId);
      isAborted = true;
      abortController.abort();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// 处理 interrupt 恢复的辅助函数
async function handleInterruptResume(threadId: string, value: any) {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let isAborted = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: MessageResponse) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // 流已关闭
        }
      };

      controller.enqueue(encoder.encode(`: connected\n\n`));

      try {
        // 导入 Command 用于恢复执行
        const { Command } = await import("@langchain/langgraph");
        const { ensureAgent } = await import("@/lib/agent");

        const agent = await ensureAgent({});

        // 使用 Command 恢复执行
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const iterable = await agent.stream(
          new Command({ resume: value }) as any,
          {
            streamMode: "messages",
            configurable: { thread_id: threadId },
          },
        );

        for await (const chunk of iterable) {
          if (isAborted || abortController.signal.aborted) {
            break;
          }

          if (!chunk || !Array.isArray(chunk) || chunk.length < 1) continue;

          const [message] = chunk;

          // 处理 ToolMessage
          if (
            message?.constructor?.name === "ToolMessage" ||
            message?.constructor?.name === "ToolMessageChunk"
          ) {
            send({
              type: "tool",
              data: {
                id: message.id || Date.now().toString(),
                content:
                  typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content),
                status: "success",
                tool_call_id: (message as any).tool_call_id || "",
                name: (message as any).name || "",
              },
            });
            continue;
          }

          // 处理 AI 消息
          const isAIMessage =
            message?.constructor?.name === "AIMessageChunk" ||
            message?.constructor?.name === "AIMessage";

          if (isAIMessage) {
            const content =
              typeof message.content === "string" ? message.content : "";
            if (content) {
              send({
                type: "ai",
                data: {
                  id: message.id || Date.now().toString(),
                  content: content,
                },
              });
            }
          }
        }

        if (!isAborted) {
          controller.enqueue(encoder.encode("event: done\n"));
          controller.enqueue(encoder.encode("data: {}\n\n"));
        }
      } catch (error) {
        if (!isAborted) {
          controller.enqueue(encoder.encode("event: error\n"));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                message:
                  error instanceof Error ? error.message : "Unknown error",
              })}\n\n`,
            ),
          );
        }
      } finally {
        try {
          controller.close();
        } catch {
          // 流已关闭
        }
      }
    },

    cancel() {
      isAborted = true;
      abortController.abort();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
