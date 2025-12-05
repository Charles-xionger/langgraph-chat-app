"use client";

import { Wrench, CheckCircle } from "lucide-react";
import type { ToolCallCardProps } from "./types";

// ==================== 通用工具调用卡片 ====================

interface GenericToolCallCardProps {
  name: string;
  args: Record<string, unknown>;
}

export const GenericToolCallCard = ({
  name,
  args,
}: GenericToolCallCardProps) => {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        <span>调用工具: {name}</span>
      </div>
      <pre className="mt-2 overflow-x-auto rounded bg-background/50 p-2 text-xs text-muted-foreground">
        {JSON.stringify(args, null, 2)}
      </pre>
    </div>
  );
};

// ==================== 通用工具结果卡片 ====================

interface GenericToolResultCardProps {
  name: string;
  content: string;
}

export const GenericToolResultCard = ({
  name,
  content,
}: GenericToolResultCardProps) => {
  let displayContent = content;
  try {
    const parsed = JSON.parse(content);
    displayContent = JSON.stringify(parsed, null, 2);
  } catch {
    // 保持原始内容
  }

  return (
    <div className="rounded-lg border border-green-200/60 bg-green-50/50 p-3 dark:border-green-800/40 dark:bg-green-950/30">
      <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>{name} 执行完成</span>
      </div>
      <pre className="mt-2 overflow-x-auto rounded bg-green-100/30 p-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
        {displayContent}
      </pre>
    </div>
  );
};
