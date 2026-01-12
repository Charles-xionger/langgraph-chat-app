"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useGetThreads,
  useHistoryMessages,
} from "@/app/api/agent/server-store";
import { useStreamedMessages } from "@/hooks/useStreamedMessages";
import { useThreadContext } from "@/contexts/ThreadContext";
import { MessageOptions, AttachmentFile } from "@/types/message";
import { MessageList } from "./MessageList";
import Composer from "./Composer";
import Junimo from "./Junimo";
import { CHATBOT_MODELS } from "@/lib/constants";
import { useModelStore } from "@/stores/modelStore";

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

  // 使用 zustand store 管理模型配置
  const { selectedModel, selectedProvider, selectedModelId, setModel } =
    useModelStore();

  const { data: threads } = useGetThreads();
  const { data: messages, isLoading: isLoadingHistory } =
    useHistoryMessages(threadId);

  const { isSending, isReceiving, sendMessage, cancel, resumeExecution } =
    useStreamedMessages(threadId, {
      provider: selectedProvider || undefined,
      model: selectedModelId,
    });

  // 处理 interrupt 响应
  const handleInterruptRespond = async (
    interruptId: string,
    response: string
  ) => {
    // 将响应映射为 allowTool 参数
    const allowTool = response === "approve" ? "allow" : "deny";

    // 如果批准，重新显示 thinking 状态
    if (allowTool === "allow") {
      setIsThinking(true);
    }

    try {
      // 调用 resumeExecution 继续执行
      await resumeExecution(allowTool as "allow" | "deny");
    } catch (error) {
      console.error("Failed to respond to interrupt:", error);
      setIsThinking(false);
    }
  };

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
  const handleSendMessage = async (
    message: string,
    files?: AttachmentFile[]
  ) => {
    const isNotEmpty = message.trim().length > 0 || (files && files.length > 0);

    if (isNotEmpty) {
      setIsThinking(true);
    }

    // 合并模型配置
    const finalOpts: MessageOptions = {
      provider: selectedProvider || undefined,
      model: selectedModelId || undefined,
      ...(files && files.length > 0 && { files }),
    };

    await sendMessage(message, files, finalOpts);

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

  // 处理模型切换
  const handleModelChange = (
    modelName: string,
    provider: string | null,
    modelId?: string
  ) => {
    setModel(modelName, provider, modelId);
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

  // 当收到 AI 回复内容时，关闭 thinking 状态
  useEffect(() => {
    if (isThinking && isReceiving) {
      // 检查是否有实际的 AI 响应内容（非工具调用）
      const lastAIMessage = messages?.findLast((msg) => msg.type === "ai");

      if (lastAIMessage) {
        const aiData = lastAIMessage.data as any;
        const hasContent =
          aiData?.content &&
          (typeof aiData.content === "string"
            ? aiData.content.trim()
            : aiData.content.length > 0);
        const hasToolCalls = aiData?.tool_calls && aiData.tool_calls.length > 0;

        // 只有当有内容且不是纯工具调用时才关闭 thinking
        if (hasContent && !hasToolCalls) {
          setIsThinking(false);
        }
      }
    }
  }, [isThinking, isReceiving, messages]);

  if (isLoadingHistory) {
    return (
      <div className="flex h-full w-full items-center justify-center stardew-box">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Junimo color="green" delay={0} />
            <Junimo color="yellow" delay={0.15} />
            <Junimo color="purple" delay={0.3} />
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
            <div className="mb-6">
              <img
                src="/junimo-dance.gif"
                alt="Junimo"
                className="w-20 h-20 object-contain mx-auto"
              />
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
            onInterruptRespond={handleInterruptRespond}
          />
        )}
      </div>

      {/* Composer input */}
      <Composer
        onSend={handleSendMessage}
        busy={isSending && !isReceiving}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  );
}
