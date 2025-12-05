export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { streamResponse } from "@/services/agentService";
import { MessageResponse } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const userContent = searchParams.get("content");

  if (!threadId || typeof userContent !== "string") {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  // 1. 定义编码器，用于将字符串转换为 Uint8Array
  const encoder = new TextEncoder();

  // 用于中断流的控制器
  const abortController = new AbortController();
  let isAborted = false;

  // 2. 创建一个可读流
  const stream = new ReadableStream<Uint8Array>({
    // 当流开始时调用
    start(controller) {
      // 定义发送数据的辅助函数
      const send = (data: MessageResponse) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
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
            userText: userContent,
            opts: {},
          });

          for await (const chunk of iterable) {
            // 检查是否已中断
            if (isAborted || abortController.signal.aborted) {
              break;
            }
            // 仅发送类型为 "ai" 或 "tool" 的消息块
            if (chunk.type === "ai" || chunk.type === "tool") {
              send(chunk);
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
              encoder.encode(
                `data: ${JSON.stringify({
                  message:
                    error instanceof Error ? error.message : "Unknown error",
                  threadId,
                })}\n\n`
              )
            );
          }
        } finally {
          try {
            controller.close();
          } catch {
            // 流已关闭，忽略
          }
        }
      })();
    },

    // 当客户端断开连接时调用
    cancel() {
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

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { threadId, content: userContent } = body || {};

  if (!threadId || typeof userContent !== "string") {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  // 1. 定义编码器，用于将字符串转换为 Uint8Array
  const encoder = new TextEncoder();

  // 用于中断流的控制器
  const abortController = new AbortController();
  let isAborted = false;

  // 2. 创建一个可读流
  const stream = new ReadableStream<Uint8Array>({
    // 当流开始时调用
    start(controller) {
      // 定义发送数据的辅助函数
      const send = (data: MessageResponse) => {
        if (isAborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
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
            userText: userContent,
            opts: {},
          });

          for await (const chunk of iterable) {
            // 检查是否已中断
            if (isAborted || abortController.signal.aborted) {
              break;
            }
            // 仅发送类型为 "ai" 或 "tool" 的消息块
            if (chunk.type === "ai" || chunk.type === "tool") {
              send(chunk);
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
              encoder.encode(
                `data: ${JSON.stringify({
                  message:
                    error instanceof Error ? error.message : "Unknown error",
                  threadId,
                })}\n\n`
              )
            );
          }
        } finally {
          try {
            controller.close();
          } catch {
            // 流已关闭，忽略
          }
        }
      })();
    },

    // 当客户端断开连接时调用
    cancel() {
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
