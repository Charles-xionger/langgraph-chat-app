import { NextResponse } from "next/server";
import {
  getAllSessions,
  createSession,
  deleteSession,
  updateSessionName,
} from "@/app/agent/db";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const sessions = getAllSessions();
    return NextResponse.json({ sessions });
  } catch (e) {
    return NextResponse.json(
      { error: "获取会话列表失败", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const session = createSession(name || `新会话`);
    return NextResponse.json({ session });
  } catch (e) {
    return NextResponse.json(
      { error: "新建会话失败", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "删除会话失败", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name } = await request.json();
    if (!id || !name)
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    updateSessionName(id, name);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "重命名会话失败", detail: String(e) },
      { status: 500 }
    );
  }
}
