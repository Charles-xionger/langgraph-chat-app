import { NextRequest, NextResponse } from "next/server";
import { RemoveMessage } from "@langchain/core/messages";
import { postgresCheckpointer } from "@/lib/agent/memory";
import { withErrorHandler } from "@/lib/errors/handler";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";

export const maxDuration = 60;

/**
 * DELETE /api/agent/messages
 * Delete messages from a thread using direct checkpoint manipulation
 *
 * Request body:
 * {
 *   threadId: string;
 *   messageIds: string[];
 * }
 */
async function handleDeleteMessages(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const { threadId, messageIds } = body;

  if (!threadId || typeof threadId !== "string") {
    return NextResponse.json(
      { error: "threadId is required and must be a string" },
      { status: 400 },
    );
  }

  if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
    return NextResponse.json(
      { error: "messageIds must be a non-empty array" },
      { status: 400 },
    );
  }

  try {
    // Get current checkpoint
    const config = { configurable: { thread_id: threadId } };
    const checkpoint = await postgresCheckpointer.get(config);

    if (!checkpoint) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Get current messages from checkpoint
    const currentMessages = checkpoint.channel_values?.messages || [];

    if (!Array.isArray(currentMessages)) {
      return NextResponse.json(
        { error: "Invalid message format in checkpoint" },
        { status: 500 },
      );
    }

    // Filter out messages with IDs in messageIds array
    const messageIdsSet = new Set(messageIds);

    // Debug: Log all message IDs before filtering
    console.log(
      "All message IDs in checkpoint:",
      currentMessages.map((m: any) => m.id),
    );
    console.log("Message IDs to delete:", messageIds);

    const filteredMessages = currentMessages.filter((msg: any) => {
      // Check if message has an id property and it's in the delete list
      const shouldKeep = !msg.id || !messageIdsSet.has(msg.id);
      if (!shouldKeep) {
        console.log(`Filtering out message with ID: ${msg.id}`);
      }
      return shouldKeep;
    });

    console.log(
      `Deleting messages: ${messageIds.join(", ")} from thread ${threadId}`,
    );
    console.log(
      `Original message count: ${currentMessages.length}, After deletion: ${filteredMessages.length}`,
    );

    // 使用 LangGraph 官方推荐的方式：通过 graph 的 state update 处理 RemoveMessage
    // 创建一个简单的 graph 来处理消息删除
    const deleteMessageNode = async (
      state: typeof MessagesAnnotation.State,
    ) => {
      // 返回包含 RemoveMessage 的更新
      const removeMessages = messageIds.map((id) => new RemoveMessage({ id }));
      return { messages: removeMessages };
    };

    // 构建一个简单的 graph 专门用于删除消息
    const deleteGraph = new StateGraph(MessagesAnnotation)
      .addNode("delete", deleteMessageNode)
      .addEdge("__start__", "delete")
      .addEdge("delete", "__end__")
      .compile({ checkpointer: postgresCheckpointer });

    // 通过调用 graph 来处理删除（使用 invoke 而不是 stream）
    await deleteGraph.invoke(
      { messages: [] }, // 空消息，因为我们只需要触发删除逻辑
      { configurable: { thread_id: threadId } },
    );

    console.log(
      `Successfully processed delete request for ${messageIds.length} messages`,
    );

    // Verify the update by reading back
    const verifyCheckpoint = await postgresCheckpointer.get(config);
    const verifyMessages = verifyCheckpoint?.channel_values?.messages || [];
    console.log(
      `Verification: Message count after update: ${Array.isArray(verifyMessages) ? verifyMessages.length : 0}`,
    );
    console.log(
      "Verification: Message IDs after update:",
      Array.isArray(verifyMessages) ? verifyMessages.map((m: any) => m.id) : [],
    );

    return NextResponse.json({
      success: true,
      data: {
        threadId,
        deletedCount: messageIds.length,
      },
    });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      {
        error: "Failed to delete messages",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const DELETE = withErrorHandler(handleDeleteMessages);
