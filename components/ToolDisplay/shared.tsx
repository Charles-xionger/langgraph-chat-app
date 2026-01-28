"use client";

import { useState } from "react";
import { Wrench, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { ToolCallCardProps } from "./types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ==================== 通用工具调用卡片 ====================

interface GenericToolCallCardProps {
  name: string;
  args: Record<string, unknown>;
}

export const GenericToolCallCard = ({
  name,
  args,
}: GenericToolCallCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const argsString = JSON.stringify(args, null, 2);
  const isLarge = argsString.length > 200;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="stardew-box rounded-lg p-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs font-medium text-[--stardew-wood] dark:text-[--stardew-wood-light] hover:text-[--stardew-wood-dark] dark:hover:text-white transition-colors w-full text-left">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 transition-transform" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 transition-transform" />
            )}
            <Wrench className="h-3.5 w-3.5" />
            <span>🔧 调用工具: {name}</span>
            {isLarge && !isOpen && (
              <span className="text-[10px] text-[--stardew-wood]/60 dark:text-[--stardew-wood-light]/60">
                (点击展开参数)
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <pre className="overflow-x-auto rounded inventory-slot p-2 text-xs text-[--stardew-text] dark:text-[--stardew-parchment] font-mono max-h-[400px] overflow-y-auto">
            {argsString}
          </pre>
        </CollapsibleContent>
      </div>
    </Collapsible>
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
  const [isOpen, setIsOpen] = useState(false);

  let displayContent = content;
  try {
    const parsed = JSON.parse(content);
    displayContent = JSON.stringify(parsed, null, 2);
  } catch {
    // 保持原始内容
  }

  const isLarge = displayContent.length > 200;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="stardew-box rounded-lg p-3 border-2 border-[#5DCC52] dark:border-[#5DCC52]/70">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs font-medium text-[#5DCC52] hover:text-[#4DB842] transition-colors w-full text-left">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 transition-transform" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 transition-transform" />
            )}
            <CheckCircle className="h-3.5 w-3.5" />
            <span>✅ {name} 执行完成</span>
            {isLarge && !isOpen && (
              <span className="text-[10px] text-[#5DCC52]/60">
                (点击展开结果)
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <pre className="overflow-x-auto rounded inventory-slot p-2 text-xs text-[--stardew-text] dark:text-[--stardew-parchment] font-mono max-h-[400px] overflow-y-auto">
            {displayContent}
          </pre>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
