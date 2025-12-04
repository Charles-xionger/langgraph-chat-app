import {
  useGetThreads,
  useHistoryMessages,
} from "@/app/api/agent/server-store";
import { useStreamedMessages } from "@/hooks/useStreamedMessages";
import { MessageOptions } from "@/types/message";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface IThreadProps {
  threadId: string;
  onFirstMessageSent?: (threadId: string) => void; // 用来处理线程中的第一条消息发送后的回调
}

export const Thread = ({ threadId, onFirstMessageSent }: IThreadProps) => {
  const firstMessageInitiatedRef = useRef(false);
  const [awaitingFirstResponse, setAwaitingFirstResponse] = useState(false);
  const { data: messages, isLoading: isLoadingHistory } =
    useHistoryMessages(threadId);

  const { isSending, isReceiving, sendMessage } = useStreamedMessages(threadId);

  // 处理发送消息的逻辑
  const handleSendMessage = async (message: string, opts?: MessageOptions) => {
    const isEmpty = message.trim().length === 0;
    await sendMessage(message, opts);

    if (isEmpty) {
      firstMessageInitiatedRef.current = true;
      setAwaitingFirstResponse(true);
    }
  };

  useEffect(() => {
    if (awaitingFirstResponse && !isSending) {
      const hasNonHuman = messages?.some((msg) => msg.type !== "human"); // 检查是否有非 human 类型的消息
      if (hasNonHuman) {
        setAwaitingFirstResponse(false);
        if (onFirstMessageSent) {
          onFirstMessageSent(threadId);
        }
      }
    }
  }, [
    awaitingFirstResponse,
    isSending,
    messages,
    onFirstMessageSent,
    threadId,
  ]);

  if (isLoadingHistory) {
    return (
      <div className="bg-background/95 supports-backdrop-filter:bg-background/60 absolute inset-0 flex items-center justify-center backdrop-blur">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-2">
          Loading conversation history...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 展示消息列表 */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages || []}
          isLoading={isSending && !isReceiving}
        />
      </div>

      {/* message input */}
      <div className="shrink-0 border-t">
        <MessageInput
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder="Send a message..."
        />
      </div>
    </div>
  );
};
