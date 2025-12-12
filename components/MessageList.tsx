"use client";

import {
  AIMessageData,
  MessageResponse,
  ToolMessageData,
  InterruptData,
} from "@/types/message";
import { Bot, User, Wrench, Square } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { MessageContent } from "./MessageContent";
import { ToolCallDisplay, ToolResultDisplay } from "./ToolDisplay";
import { InterruptDisplay } from "./InterruptDisplay";

// 判断消息是否有实际内容需要展示
function hasDisplayableContent(
  message: MessageResponse,
  toolResultIds: Set<string>
): boolean {
  const data = message.data as AIMessageData;

  // 检查是否有文本内容
  const hasContent =
    typeof data.content === "string"
      ? data.content.trim().length > 0
      : Array.isArray(data.content) && data.content.length > 0;

  // 检查是否有工具调用（且该调用还没有结果）
  const hasToolCalls = data.tool_calls && data.tool_calls.length > 0;
  const hasPendingToolCalls =
    hasToolCalls && data.tool_calls!.some((tc) => !toolResultIds.has(tc.id));

  return (
    hasContent ||
    hasPendingToolCalls ||
    message.type === "tool" ||
    message.type === "interrupt"
  );
}

interface MessageListProps {
  messages: MessageResponse[];
  isThinking?: boolean;
  onCancelThinking?: () => void;
  onInterruptRespond?: (interruptId: string, response: string) => void;
}

export const MessageList = ({
  messages,
  isThinking,
  onCancelThinking,
  onInterruptRespond,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // 收集所有已完成的工具调用 ID（tool_call_id）
  const toolResultIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach((msg) => {
      if (msg.type === "tool") {
        const toolData = msg.data as ToolMessageData;
        if (toolData.tool_call_id) {
          ids.add(toolData.tool_call_id);
        }
      }
    });
    return ids;
  }, [messages]);

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div className="space-y-3">
              <div className="mx-auto">
                <img
                  src="/junimo.png"
                  alt="Junimo"
                  className="w-16 h-16 object-contain mx-auto"
                />
              </div>
              <p className="text-[#A05030] dark:text-[#C78F56] pixel-text-sm">
                Start a conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          messages
            .filter((message) => hasDisplayableContent(message, toolResultIds))
            .map((message, index) => {
              const aiData = message.data as AIMessageData;
              const hasToolCalls =
                aiData.tool_calls && aiData.tool_calls.length > 0;
              // 过滤出还没有结果的工具调用
              const pendingToolCalls = hasToolCalls
                ? aiData.tool_calls!.filter((tc) => !toolResultIds.has(tc.id))
                : [];
              const hasPendingToolCalls = pendingToolCalls.length > 0;

              const hasContent =
                typeof aiData.content === "string"
                  ? aiData.content.trim().length > 0
                  : Array.isArray(aiData.content) && aiData.content.length > 0;

              return (
                <div
                  key={message.data.id || index}
                  className={`flex gap-3 ${
                    message.type === "human" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type !== "human" && (
                    <div className="mt-0.5 shrink-0">
                      <div className="relative">
                        <img
                          src="/junimo.png"
                          alt="Junimo"
                          className="w-8 h-8 object-contain"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#5DCC52] rounded-full border border-[#FFFAE6] dark:border-[#1a1f2e]"></div>
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      message.type === "human"
                        ? "stardew-box rounded-2xl px-4 py-3 border-2 border-[#FFD700] shadow-sm"
                        : message.type === "error"
                        ? "stardew-box rounded-lg px-4 py-3 border-2 border-red-600 dark:border-red-500"
                        : message.type === "tool" ||
                          message.type === "interrupt" ||
                          (hasPendingToolCalls && !hasContent)
                        ? "" // 工具卡片和中断卡片自带样式，不需要额外背景
                        : "stardew-box rounded-2xl px-4 py-3"
                    }`}
                  >
                    {message.type === "interrupt" ? (
                      <InterruptDisplay
                        data={message.data as InterruptData}
                        onRespond={onInterruptRespond}
                      />
                    ) : message.type === "tool" ? (
                      <ToolResultDisplay
                        data={message.data as ToolMessageData}
                      />
                    ) : hasPendingToolCalls && !hasContent ? (
                      // 仅有待处理的工具调用，无文本内容
                      <div className="space-y-2">
                        {pendingToolCalls.map((toolCall, idx) => (
                          <ToolCallDisplay
                            key={toolCall.id || idx}
                            toolCall={toolCall}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-[--stardew-text] dark:text-[--stardew-parchment]">
                        <MessageContent message={message} />
                      </div>
                    )}
                  </div>
                  {message.type === "human" && (
                    <div className="mt-0.5 shrink-0">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#FFD700] shadow-sm inventory-slot">
                        <img
                          src="/Jack 'O' Lantern.png"
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
        {isThinking && (
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <img
                src="/junimo-dance.gif"
                alt="Junimo thinking"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex items-center gap-3 inventory-slot rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <div
                  className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[#5DCC52]"
                  style={{ animationDelay: "-0.3s" }}
                ></div>
                <div
                  className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[#FFD700]"
                  style={{ animationDelay: "-0.15s" }}
                ></div>
                <div className="h-2.5 w-2.5 junimo-bounce rounded-full bg-[#9A55FF]"></div>
              </div>
              <span className="pixel-text-sm text-[#A05030] dark:text-[#C78F56]">
                Junimo is thinking...
              </span>
              {onCancelThinking && (
                <button
                  onClick={onCancelThinking}
                  className="ml-2 inline-flex items-center gap-1 stardew-box rounded px-2 py-1 text-xs text-[#A05030] dark:text-[#C78F56] hover:bg-[#C78F56]/20"
                >
                  <Square className="h-3 w-3" /> Pause
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
