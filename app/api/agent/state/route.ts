// 获取 thread 的当前状态，包括是否有待处理的 interrupt
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ensureAgent } from "@/lib/agent";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json(
      { error: "threadId is required" },
      { status: 400 }
    );
  }

  try {
    const agent = await ensureAgent({});

    // 获取 thread 的当前状态
    const state = await agent.getState({
      configurable: { thread_id: threadId },
    });

    // 检查是否有待处理的 interrupt
    const hasInterrupt =
      state.tasks &&
      state.tasks.length > 0 &&
      state.tasks.some(
        (task: any) => task.interrupts && task.interrupts.length > 0
      );

    let interruptData = null;
    if (hasInterrupt) {
      // 找到第一个 interrupt
      for (const task of state.tasks) {
        if (task.interrupts && task.interrupts.length > 0) {
          interruptData = task.interrupts[0].value;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      threadId,
      hasInterrupt,
      interruptData,
      next: state.next,
      values: state.values,
    });
  } catch (error) {
    console.error("Failed to get thread state:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
