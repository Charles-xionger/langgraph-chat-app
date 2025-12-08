"use client";

import { Calculator, Equal, XCircle } from "lucide-react";
import type { ToolCallCardProps, ToolResultCardProps } from "./types";

// ==================== 计算器调用卡片 ====================

export const CalculatorCallCard = ({ args }: ToolCallCardProps) => {
  const expression = (args.expression as string) || "";

  return (
    <div className="flex items-center gap-3 stardew-box rounded-lg p-3 border-2 border-[#9A55FF] dark:border-[#9A55FF]/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-full inventory-slot">
        <Calculator className="h-5 w-5 text-[#9A55FF]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment]">
          🔢 计算表达式
        </p>
        <code className="text-xs font-mono text-[--stardew-wood] dark:text-[--stardew-wood-light]">
          {expression}
        </code>
      </div>
      <div className="animate-pulse text-xs text-[#9A55FF] pixel-text">
        计算中...
      </div>
    </div>
  );
};

// ==================== 计算器结果卡片 ====================

export const CalculatorResultCard = ({ content }: ToolResultCardProps) => {
  const isError = content.includes("错误");

  if (isError) {
    return (
      <div className="flex items-center gap-3 stardew-box rounded-lg p-3 border-2 border-red-600 dark:border-red-500">
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-400">{content}</p>
      </div>
    );
  }

  // 解析计算结果，格式通常是 "计算结果：expression = result"
  const { expression, result } = parseCalculatorResult(content);

  return (
    <div className="overflow-hidden stardew-box rounded-xl border-4 border-[#9A55FF] dark:border-[#9A55FF]/70">
      <div className="p-4">
        <div className="flex items-center gap-2 text-[#9A55FF]">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-medium pixel-text">✨ 计算结果</span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="rounded-lg inventory-slot px-4 py-2 font-mono text-lg text-[--stardew-text] dark:text-[--stardew-parchment]">
            {expression}
          </div>
          <Equal className="h-5 w-5 text-[#9A55FF]" />
          <div className="rounded-lg inventory-slot px-4 py-2 font-mono text-2xl font-bold text-[#9A55FF] border-2 border-[#9A55FF]">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 辅助函数 ====================

function parseCalculatorResult(content: string): {
  expression: string;
  result: string;
} {
  const match = content.match(/(.+?)\s*=\s*(.+)/);

  if (match) {
    return {
      expression: match[1].replace("计算结果：", "").trim(),
      result: match[2].trim(),
    };
  }

  return { expression: content, result: "" };
}
