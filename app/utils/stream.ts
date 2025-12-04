// utils/stream.ts
import { AppType } from "@/app/agent/graph";
import { BaseMessage } from "@langchain/core/messages";
import { TextEncoder } from "util";

interface StreamConfig {
  configurable?: {
    thread_id?: string;
  };
}

export async function createChatStream(
  app: AppType,
  userMessage: BaseMessage,
  threadConfig: StreamConfig,
  threadId: string
) {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of app.streamEvents(
          { messages: [userMessage] },
          { version: "v2", ...threadConfig }
        )) {
          if (event.event === "on_chat_model_stream") {
            const chunk = event.data?.chunk;
            if (chunk?.content) {
              const data =
                JSON.stringify({
                  type: "chunk",
                  content: chunk.content,
                }) + "\n";
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
        }
        // 发送结束标记
        const endData =
          JSON.stringify({
            type: "end",
            status: "success",
            thread_id: threadId,
          }) + "\n";
        controller.enqueue(new TextEncoder().encode(endData));
        controller.close();
      } catch (error) {
        console.error("流式聊天错误:", error);
        const errorData =
          JSON.stringify({
            type: "error",
            error: "服务器内部错误",
            message: "抱歉，处理你的请求时出现了问题。请稍后重试。",
          }) + "\n";
        controller.enqueue(new TextEncoder().encode(errorData));
        controller.close();
      }
    },
  });
}
