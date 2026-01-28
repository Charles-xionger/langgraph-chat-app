import { fetchThreadHistory } from "@/services/agentService";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/database/pirsma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> },
) {
  // 验证用户认证
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // In Next.js 15 dynamic route handlers, params is now async.
  const { threadId } = await params;

  // 验证thread是否属于当前用户
  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      userId: session.user.id,
    },
  });

  if (!thread) {
    return NextResponse.json(
      { success: false, error: "Thread not found" },
      { status: 404 },
    );
  }

  const messages = await fetchThreadHistory(threadId);
  return NextResponse.json(messages, { status: 200 });
}
