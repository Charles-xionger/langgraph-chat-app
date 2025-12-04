import { streamResponse } from "@/services/agentService";
import { MessageResponse } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";

async function POST(request: NextRequest) {
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

  // 2. 创建一个可读流
  const stream = new ReadableStream<Uint8Array>({
    // 当流开始时调用
    start(controller) {
      // 定义发送数据的辅助函数
      const send = (data: MessageResponse) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial comment to establish stream
      // 初始化连接时发送一个注释，防止某些浏览器超时
      controller.enqueue(encoder.encode(`: connected\n\n`));

      // 3. 调用 agentService 的流式接口
      async () => {
        try {
          const iterable = await streamResponse({
            threadId,
            userText: userContent,
            opts: {},
          });

          for await (const chunk of iterable) {
            // 仅发送类型为 "ai" 或 "tool" 的消息块
            if (chunk.type === "ai" || chunk.type === "tool") {
              send(chunk);
            }
          }

          // 流结束时发送一个特殊的结束信号
          controller.enqueue(encoder.encode("event: done\n"));
          controller.enqueue(encoder.encode("data: {}\n\n"));
        } catch (error) {
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
        } finally {
          controller.close();
        }
      };
    },

    // 当流关闭时调用
    cancel() {
      // 如果客户端断开连接，目前没有什么特别的处理（LangGraph 流会随着迭代停止而终止）
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
