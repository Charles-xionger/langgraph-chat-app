export interface Thread {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentFile {
  text?: string;
  url?: string;
  data?: string; // base64 数据
  type: "image" | "pdf" | "audio" | "video";
  source_type: "url" | "base64";
  name: string;
  size: number;
}

export interface MessageOptions {
  provider?: string;
  model?: string;
  tools?: string[];
  allowTool?: "allow" | "deny";
  approveAllTools?: boolean; // if true, skip tool approval prompts
  files?: AttachmentFile[]; // 多模态文件支持
  mcpUrl?: string; // MCP server URL for external tools
}

export interface BasicMessageData {
  id: string;
  content: string | MultiModalContent[];
}

// 多模态内容类型
export interface MultiModalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id: string;
  type: "tool_call";
}

export interface FunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ContentItem {
  functionCall?: FunctionCall;
  thoughtSignature?: string;
}

export interface ToolCallChunk {
  name: string;
  args: string;
  index: number;
  type: "tool_call_chunk";
  id: string;
}

export interface AIMessageData {
  id: string;
  content: string | ContentItem[];
  tool_calls?: ToolCall[];
  tool_call_chunks?: ToolCallChunk[];
  additional_kwargs?: Record<string, unknown>;
  invalid_tool_calls?: unknown[];
  response_metadata?: Record<string, unknown>;
}

export interface ToolMessageData {
  id: string;
  content: string;
  status: string;
  artifact?: unknown[];
  tool_call_id: string;
  name: string;
  metadata?: Record<string, unknown>;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

// Interrupt 相关类型
export type InterruptType = "choice" | "input" | "confirm";

export interface InterruptOption {
  id: string;
  label: string;
  description?: string;
}

export interface InterruptData {
  id: string;
  type: InterruptType;
  question: string;
  options?: InterruptOption[];
  currentValue?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export type MessageResponse =
  | {
      type: "human" | "ai" | "tool" | "error";
      data: BasicMessageData | AIMessageData | ToolMessageData;
    }
  | {
      type: "interrupt";
      data: InterruptData;
    };
