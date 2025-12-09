import {
  useGetThreads,
  useHistoryMessages,
} from "@/app/api/agent/server-store";
import { useStreamedMessages } from "@/hooks/useStreamedMessages";
import { MessageOptions } from "@/types/message";
import { useEffect, useRef, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useThreadContext } from "@/contexts/ThreadContext";
import Junimo from "./Junimo";

interface IThreadProps {
  threadId: string;
  onFirstMessageSent?: (threadId: string) => void; // 用来处理线程中的第一条消息发送后的回调
}

export const Thread = ({ threadId, onFirstMessageSent }: IThreadProps) => {
  const { setCurrentThread } = useThreadContext();
  const firstMessageInitiatedRef = useRef(false);
  const [awaitingFirstResponse, setAwaitingFirstResponse] = useState(false);
  const { data: threads } = useGetThreads();
  const { data: messages, isLoading: isLoadingHistory } =
    useHistoryMessages(threadId);

  const { isSending, isReceiving, sendMessage, cancel } =
    useStreamedMessages(threadId);

  // 更新当前线程信息到 context
  useEffect(() => {
    const thread = threads?.find((t) => t.id === threadId);
    if (thread && messages) {
      setCurrentThread({
        id: thread.id,
        title: thread.title,
        updatedAt: thread.updatedAt,
        messages: messages,
      });
    }
  }, [threadId, threads, messages, setCurrentThread]);

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
      <div className="absolute inset-0 flex items-center justify-center stardew-box">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Junimo color="green" delay={0} />
            <Junimo color="yellow" delay={0.15} />
            <Junimo color="purple" delay={0.3} />
          </div>
          <p className="pixel-text-sm text-[#A05030] dark:text-[#C78F56]">
            Loading conversation history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 展示消息列表 */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages || []} />
      </div>

      {/* message input */}
      <div className="shrink-0 border-t">
        <MessageInput
          onSend={handleSendMessage}
          onCancel={cancel}
          disabled={isSending && !isReceiving}
          isStreaming={isReceiving}
          placeholder="Send a message..."
        />
      </div>
    </div>
  );
};
