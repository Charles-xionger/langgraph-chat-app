import prisma from "@/lib/database/pirsma";
import { Thread } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";
import { ValidationError, withErrorHandler } from "@/lib/errors";
import { auth } from "@/lib/auth";

type ThreadEntity = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * @description 获取所有线程的列表
 * @returns 线程列表的 JSON 响应
 */
export const GET = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const dbThreads = await prisma.thread.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50, // 限制返回的线程数量
  });

  const threads: Thread[] = dbThreads.map((t: ThreadEntity) => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt.toISOString(), // 转换为 ISO 字符串
    updatedAt: t.updatedAt.toISOString(),
  }));

  return NextResponse.json({ success: true, data: threads }, { status: 200 });
});

/**
 * @description 创建一个新的线程
 * @returns 新创建的线程的 JSON 响应
 */
export const POST = withErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 生成友好的时间标题
  const now = new Date();
  const timeStr = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const title = `对话 ${timeStr}`;

  const createdThread = await prisma.thread.create({
    data: {
      title,
      userId: session.user.id,
    },
  });

  const thread: Thread = {
    id: createdThread.id,
    title: createdThread.title,
    createdAt: createdThread.createdAt.toISOString(),
    updatedAt: createdThread.updatedAt.toISOString(),
  };

  return NextResponse.json({ success: true, data: thread }, { status: 201 });
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const { threadId, title } = body || {};

  if (!threadId || typeof title !== "string") {
    throw new ValidationError("Invalid request body", {
      threadId: !threadId ? ["threadId is required"] : [],
      title: typeof title !== "string" ? ["title must be a string"] : [],
    });
  }

  const updatedThread = await prisma.thread.update({
    where: {
      id: threadId,
      userId: session.user.id,
    },
    data: { title },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: updatedThread.id,
        title: updatedThread.title,
        createdAt: updatedThread.createdAt.toISOString(),
        updatedAt: updatedThread.updatedAt.toISOString(),
      },
    },
    { status: 200 },
  );
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const { threadId } = body || {};

  if (!threadId || typeof threadId !== "string") {
    throw new ValidationError("Invalid threadId", {
      threadId: ["threadId is required and must be a string"],
    });
  }

  // Prisma 会自动抛出 P2025 错误，会被 handlePrismaError 捕获并转换为 NotFoundError
  await prisma.thread.delete({
    where: {
      id: threadId,
      userId: session.user.id,
    },
  });

  return NextResponse.json(
    { success: true, message: "Thread deleted successfully" },
    { status: 200 },
  );
});
