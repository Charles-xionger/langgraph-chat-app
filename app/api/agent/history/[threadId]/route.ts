import { fetchThreadHistory } from "@/services/agentService";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  // In Next.js 15 dynamic route handlers, params is now async.
  const { threadId } = await params;

  const messages = await fetchThreadHistory(threadId);
  return NextResponse.json(messages, { status: 200 });
}
