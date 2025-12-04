import { HumanMessage } from "langchain";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getApp } from "../../agent/graph";
import { createChatStream } from "../../utils/stream";

export async function POST(request: NextRequest) {
  try {
    const { message, thread_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "无效的消息格式",
          response: "请提供有效的消息内容。",
        },
        { status: 400 }
      );
    }

    // 如果没有提供 thread_id，则生成一个新的 UUID
    const threadId =
      thread_id && typeof thread_id === "string" ? thread_id : randomUUID();
    const threadConfig = {
      configurable: {
        thread_id: threadId,
      },
    };

    // 创建消息对象
    const userMessage = new HumanMessage(message);

    // 获取应用实例
    const app = await getApp();
    // 使用工具函数创建流式响应
    const stream = await createChatStream(
      app,
      userMessage,
      threadConfig,
      threadId
    );
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("聊天 API 错误:", error);
    return NextResponse.json(
      {
        error: "服务器内部错误",
        response: "抱歉，处理你的请求时出现了问题。请稍后重试。",
      },
      { status: 500 }
    );
  }
}
