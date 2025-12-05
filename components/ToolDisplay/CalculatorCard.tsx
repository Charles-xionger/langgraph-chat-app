"use client";

import { Calculator, Equal, XCircle } from "lucide-react";
import type { ToolCallCardProps, ToolResultCardProps } from "./types";

// ==================== 计算器调用卡片 ====================

export const CalculatorCallCard = ({ args }: ToolCallCardProps) => {
  const expression = (args.expression as string) || "";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-purple-200/60 bg-[linear-gradient(120deg,#e0c3fc30,#8ec5fc30)] p-3 dark:border-purple-700/40 dark:bg-[linear-gradient(120deg,#e0c3fc15,#8ec5fc15)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100/80 dark:bg-purple-900/50">
        <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          计算表达式
        </p>
        <code className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {expression}
        </code>
      </div>
      <div className="animate-pulse text-xs text-purple-500 dark:text-purple-400">
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
      <div className="flex items-center gap-3 rounded-lg border border-red-200/60 bg-red-50/50 p-3 dark:border-red-800/40 dark:bg-red-950/30">
        <XCircle className="h-4 w-4 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{content}</p>
      </div>
    );
  }

  // 解析计算结果，格式通常是 "计算结果：expression = result"
  const { expression, result } = parseCalculatorResult(content);

  return (
    <div className="overflow-hidden rounded-xl border border-purple-200/60 bg-[linear-gradient(120deg,#e0c3fc,#8ec5fc)] shadow-sm dark:border-purple-700/40 dark:bg-[linear-gradient(120deg,#e0c3fccc,#8ec5fccc)]">
      <div className="p-4 text-gray-700 dark:text-gray-800">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-700">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-medium">计算结果</span>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="rounded-lg bg-white/50 px-4 py-2 font-mono text-lg backdrop-blur-sm text-gray-700">
            {expression}
          </div>
          <Equal className="h-5 w-5 text-gray-500" />
          <div className="rounded-lg bg-white/60 px-4 py-2 font-mono text-2xl font-bold backdrop-blur-sm text-gray-800">
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
