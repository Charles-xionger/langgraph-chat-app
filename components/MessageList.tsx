"use client";

import {
  AIMessageData,
  MessageResponse,
  ToolMessageData,
} from "@/types/message";
import { Bot, User, Wrench } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { MessageContent } from "./MessageContent";
import { ToolCallDisplay, ToolResultDisplay } from "./ToolDisplay";

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

  return hasContent || hasPendingToolCalls || message.type === "tool";
}

interface MessageListProps {
  messages: MessageResponse[];
  isLoading?: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
            <div className="space-y-2">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {message.type === "tool" ||
                      (hasPendingToolCalls && !hasContent) ? (
                        <Wrench className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg ${
                      message.type === "human"
                        ? "bg-primary text-primary-foreground px-4 py-2"
                        : message.type === "error"
                        ? "bg-destructive text-destructive-foreground px-4 py-2"
                        : message.type === "tool" ||
                          (hasPendingToolCalls && !hasContent)
                        ? "" // 工具卡片自带样式，不需要额外背景
                        : "bg-muted px-4 py-2"
                    }`}
                  >
                    {message.type === "tool" ? (
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
                      <div className="text-sm">
                        <MessageContent message={message} />
                      </div>
                    )}
                  </div>
                  {message.type === "human" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-foreground/60"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
