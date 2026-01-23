"use client";

import {
  AIMessageData,
  MessageResponse,
  ToolMessageData,
  InterruptData,
} from "@/types/message";
import { Square, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { MessageContent } from "./MessageContent";
import { ToolCallDisplay, ToolResultDisplay } from "./ToolDisplay";
import { InterruptDisplay } from "./InterruptDisplay";
import { useDeleteMessages } from "@/hooks/useDeleteMessages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// 判断消息是否有实际内容需要展示
function hasDisplayableContent(
  message: MessageResponse,
  toolResultIds: Set<string>,
): boolean {
  // interrupt 类型始终展示
  if (message.type === "interrupt") {
    return true;
  }

  // tool 类型始终展示
  if (message.type === "tool") {
    return true;
  }

  // 对于 AI/human/error 消息，检查是否有内容
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

  return !!(hasContent || hasPendingToolCalls);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { mutate: deleteMessageMutation, isPending: isDeleting } =
    useDeleteMessages();

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

  // 处理删除消息
  const handleDeleteClick = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessageMutation(
        { messageIds: [messageToDelete] },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setMessageToDelete(null);
          },
        },
      );
    }
  };

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
                  className="group/message space-y-2"
                >
                  <div
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
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={`${
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
                      {/* Delete button below message */}
                      <div
                        className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
                      >
                        <button
                          onClick={() => handleDeleteClick(message.data.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B7355] dark:text-[#C78F56] hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover/message:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="pixel-text-xs">Delete</span>
                        </button>
                      </div>
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="stardew-box border-2 border-[#8B7355]">
          <AlertDialogHeader>
            <AlertDialogTitle className="pixel-text text-[#654321] dark:text-[#C78F56]">
              Delete Message
            </AlertDialogTitle>
            <AlertDialogDescription className="pixel-text-sm text-[#8B7355] dark:text-[#C78F56]">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="stardew-button pixel-text-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="stardew-button pixel-text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
};
