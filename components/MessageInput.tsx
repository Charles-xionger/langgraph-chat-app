"use client";

import { Send, Square, Loader2 } from "lucide-react";
import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "./ui/button";

interface MessageInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export const MessageInput = ({
  onSend,
  onCancel,
  disabled = false,
  isStreaming = false,
  placeholder = "Type a message...",
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled && !isStreaming) {
      onSend(message);
      setMessage("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleCancel = () => {
    if (isStreaming && onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              rows={1}
              className="w-full resize-none overflow-hidden rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              style={{ maxHeight: "200px" }}
            />
          </div>
          <Button
            onClick={isStreaming ? handleCancel : handleSend}
            disabled={disabled || (!isStreaming && !message.trim())}
            size="icon"
            variant={isStreaming ? "destructive" : "default"}
            className="h-11 w-11 shrink-0 relative"
            title={isStreaming ? "Stop generating" : "Send message"}
          >
            {isStreaming && (
              <span className="absolute inset-0 rounded-md animate-ping bg-destructive/30" />
            )}
            {isStreaming ? (
              <Square className="h-4 w-4 fill-current relative z-10" />
            ) : disabled ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
