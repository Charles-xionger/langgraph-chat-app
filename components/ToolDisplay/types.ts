import { ToolCall, ToolMessageData } from "@/types/message";

export interface ToolCallCardProps {
  args: Record<string, unknown>;
}

export interface ToolResultCardProps {
  content: string;
}

export interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export interface ToolResultDisplayProps {
  data: ToolMessageData;
}
