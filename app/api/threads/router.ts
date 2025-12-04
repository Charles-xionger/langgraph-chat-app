import prisma from "@/lib/database/pirsma";
import { Thread } from "@/types/message";
import { NextRequest, NextResponse } from "next/server";

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
export async function GET() {
  const dbThreads = await prisma.thread.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50, // 限制返回的线程数量
  });

  const threads: Thread[] = dbThreads.map((t: ThreadEntity) => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt.toISOString(), // 转换为 ISO 字符串
    updatedAt: t.updatedAt.toISOString(),
  }));

  return NextResponse.json(threads, { status: 200 });
}

/**
 * @description 创建一个新的线程
 * @returns 新创建的线程的 JSON 响应
 */
export async function POST() {
  const createdThread = await prisma.thread.create({
    data: {
      title: "New Thread",
    },
  });

  const thread: Thread = {
    id: createdThread.id,
    title: createdThread.title,
    createdAt: createdThread.createdAt.toISOString(),
    updatedAt: createdThread.updatedAt.toISOString(),
  };

  return NextResponse.json(thread, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const { threadId, title } = body || {};

    if (!threadId || typeof title !== "string") {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const updatedThread = await prisma.thread.update({
      where: { id: threadId },
      data: { title },
    });

    return NextResponse.json(
      {
        id: updatedThread.id,
        title: updatedThread.title,
        createdAt: updatedThread.createdAt.toISOString(),
        updatedAt: updatedThread.updatedAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const { threadId } = body || {};

    if (!threadId || typeof threadId !== "string") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    await prisma.thread.delete({
      where: { id: threadId },
    });

    return NextResponse.json(
      { message: "Thread deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
