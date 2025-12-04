import { NextRequest, NextResponse } from "next/server";
import { getApp } from "@/app/agent/graph";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const threadId = searchParams.get("thread_id");

    if (!threadId) {
      return NextResponse.json(
        { error: "缺少 thread_id 参数" },
        { status: 400 }
      );
    }

    const app = await getApp();

    // 获取该 thread 的状态
    const state = await app.getState({
      configurable: { thread_id: threadId },
    });

    // 从状态中提取消息历史
    const messages = state.values?.messages || [];

    // 转换为前端需要的格式
    const formattedMessages = messages.map((msg: any, index: number) => ({
      id: `${threadId}-${index}`,
      type: msg._getType() === "human" ? "user" : "assistant",
      content: msg.content,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("获取历史消息错误:", error);
    return NextResponse.json(
      { error: "获取历史消息失败", detail: String(error) },
      { status: 500 }
    );
  }
}
