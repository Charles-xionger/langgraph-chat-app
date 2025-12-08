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
    <div className="stardew-box rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[--stardew-wood] dark:text-[--stardew-wood-light]">
        <Wrench className="h-3.5 w-3.5" />
        <span>🔧 调用工具: {name}</span>
      </div>
      <pre className="mt-2 overflow-x-auto rounded inventory-slot p-2 text-xs text-[--stardew-text] dark:text-[--stardew-parchment] font-mono">
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
    <div className="stardew-box rounded-lg p-3 border-2 border-[#5DCC52] dark:border-[#5DCC52]/70">
      <div className="flex items-center gap-2 text-xs font-medium text-[#5DCC52]">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>✅ {name} 执行完成</span>
      </div>
      <pre className="mt-2 overflow-x-auto rounded inventory-slot p-2 text-xs text-[--stardew-text] dark:text-[--stardew-parchment] font-mono">
        {displayContent}
      </pre>
    </div>
  );
};
