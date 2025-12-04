"use client";

import { MessageResponse } from "@/types/message";
import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { MessageContent } from "./MessageContent";

interface MessageListProps {
  messages: MessageResponse[];
  isLoading?: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
          messages.map((message, index) => (
            <div
              key={message.data.id || index}
              className={`flex gap-3 ${
                message.type === "human" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type !== "human" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === "human"
                    ? "bg-primary text-primary-foreground"
                    : message.type === "error"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted"
                }`}
              >
                {message.type === "tool" ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold opacity-70">
                      Tool: {(message.data as any).name}
                    </p>
                    <div className="text-sm">
                      <MessageContent message={message} />
                    </div>
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
          ))
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
