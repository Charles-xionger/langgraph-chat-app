"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useGetThreads,
  useHistoryMessages,
} from "@/app/api/agent/server-store";
import { useStreamedMessages } from "@/hooks/useStreamedMessages";
import { useThreadContext } from "@/contexts/ThreadContext";
import { MessageOptions } from "@/types/message";
import { MessageList } from "./MessageList";
import Composer from "./Composer";
import Junimo from "./Junimo";

interface ChatPaneProps {
  threadId: string;
  onFirstMessageSent?: (threadId: string) => void;
}

export default function ChatPane({
  threadId,
  onFirstMessageSent,
}: ChatPaneProps) {
  const { setCurrentThread } = useThreadContext();
  const firstMessageInitiatedRef = useRef(false);
  const [awaitingFirstResponse, setAwaitingFirstResponse] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
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
    const isNotEmpty = message.trim().length > 0;

    if (isNotEmpty) {
      setIsThinking(true);
    }

    await sendMessage(message, opts);

    if (isNotEmpty) {
      firstMessageInitiatedRef.current = true;
      setAwaitingFirstResponse(true);
    }
  };

  // 处理暂停思考
  const handlePauseThinking = () => {
    cancel();
    setIsThinking(false);
  };

  useEffect(() => {
    if (awaitingFirstResponse && !isSending) {
      const hasNonHuman = messages?.some((msg) => msg.type !== "human");
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

  // 当收到第一条 AI 回复时，关闭 thinking 状态
  useEffect(() => {
    if (isThinking && isReceiving) {
      setIsThinking(false);
    }
  }, [isThinking, isReceiving]);

  // 当发送完成但没有接收到回复时，也要关闭 thinking
  useEffect(() => {
    if (isThinking && !isSending && !isReceiving) {
      setIsThinking(false);
    }
  }, [isThinking, isSending, isReceiving]);

  if (isLoadingHistory) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F2E6C2]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Junimo color="green" />
            <Junimo color="yellow" />
            <Junimo color="purple" />
          </div>
          <p className="pixel-text-sm text-[#A05030]">
            Loading conversation history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#FFFAE6] dark:bg-[#1a1f2e]/50">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        {!messages || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="relative mb-6">
              <div className="w-16 h-20 bg-[#5DCC52] rounded-t-full relative junimo-bounce">
                <div className="absolute top-5 left-3 w-2.5 h-2.5 bg-[#421808] rounded-full" />
                <div className="absolute top-5 right-3 w-2.5 h-2.5 bg-[#421808] rounded-full" />
                <div className="absolute -top-2 left-3 w-2 h-4 bg-[#3da83d] rounded-full transform -rotate-12" />
                <div className="absolute -top-2 right-3 w-2 h-4 bg-[#3da83d] rounded-full transform rotate-12" />
              </div>
            </div>
            <h2 className="pixel-text-xl text-[#451806] dark:text-[#F2E6C2] mb-3 flex items-center gap-3">
              <span className="text-[#FFD700] text-xl">✦</span>
              Welcome to the Valley!
              <span className="text-[#FFD700] text-xl">✦</span>
            </h2>
            <p className="pixel-text-md text-[#A05030] dark:text-[#C78F56] max-w-md">
              The Junimos are ready to help you with anything - coding, writing,
              farming tips, and more!
            </p>
          </div>
        ) : (
          <MessageList
            messages={messages || []}
            isThinking={isThinking}
            onCancelThinking={handlePauseThinking}
          />
        )}
      </div>

      {/* Composer input */}
      <Composer onSend={handleSendMessage} busy={isSending && !isReceiving} />
    </div>
  );
}
