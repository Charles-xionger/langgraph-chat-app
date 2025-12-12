"use client";

import { InterruptData } from "@/types/message";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface InterruptDisplayProps {
  data: InterruptData;
  onRespond?: (interruptId: string, response: string) => void;
}

// 辅助函数：安全获取 metadata 中的值
function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!metadata || !(key in metadata)) return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : String(value);
}

export const InterruptDisplay = ({
  data,
  onRespond,
}: InterruptDisplayProps) => {
  const [isResponding, setIsResponding] = useState(false);

  const handleResponse = async (optionId: string) => {
    if (isResponding || !onRespond) return;
    setIsResponding(true);
    try {
      await onRespond(data.id, optionId);
    } catch (error) {
      console.error("Error responding to interrupt:", error);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="stardew-box rounded-lg border-2 border-[#FFD700] bg-[#FFFAE6] dark:bg-[#2a2f3e] p-4 space-y-3">
      {/* 标题区域 */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <AlertCircle className="h-5 w-5 text-[#FFD700]" />
        </div>
        <div className="flex-1">
          <h3 className="pixel-text-sm font-bold text-[#A05030] dark:text-[#FFD700] mb-1">
            {data.question}
          </h3>
          {data.context && (
            <div className="text-xs text-[#A05030]/80 dark:text-[#C78F56]/80 whitespace-pre-wrap font-mono bg-white/50 dark:bg-black/20 rounded p-2 mt-2">
              {data.context}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      {data.options && data.options.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {data.options.map((option) => {
            const isApprove = option.id === "approve";
            const isReject = option.id === "reject";

            return (
              <button
                key={option.id}
                onClick={() => handleResponse(option.id)}
                disabled={isResponding}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  stardew-box border-2 transition-all
                  pixel-text-sm font-bold
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isApprove
                      ? "border-[#5DCC52] text-[#5DCC52] hover:bg-[#5DCC52]/10 active:scale-95"
                      : isReject
                      ? "border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10 active:scale-95"
                      : "border-[#FFD700] text-[#A05030] dark:text-[#FFD700] hover:bg-[#FFD700]/10 active:scale-95"
                  }
                `}
                title={option.description}
              >
                {isApprove && <CheckCircle className="h-4 w-4" />}
                {isReject && <XCircle className="h-4 w-4" />}
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 工具信息（从 metadata 中提取） */}
      {getMetadataValue(data.metadata, "toolName") && (
        <div className="text-xs text-[#A05030]/60 dark:text-[#C78F56]/60 pt-2 border-t border-[#FFD700]/30">
          工具:{" "}
          <span className="font-mono">
            {getMetadataValue(data.metadata, "toolName")}
          </span>
          {getMetadataValue(data.metadata, "toolCallId") && (
            <span className="ml-2 opacity-50">
              ID: {getMetadataValue(data.metadata, "toolCallId")?.slice(-8)}
            </span>
          )}
        </div>
      )}

      {isResponding && (
        <div className="flex items-center gap-2 text-xs text-[#A05030] dark:text-[#C78F56] pt-2">
          <div className="flex gap-1">
            <div
              className="h-1.5 w-1.5 rounded-full bg-[#5DCC52] junimo-bounce"
              style={{ animationDelay: "-0.3s" }}
            ></div>
            <div
              className="h-1.5 w-1.5 rounded-full bg-[#FFD700] junimo-bounce"
              style={{ animationDelay: "-0.15s" }}
            ></div>
            <div className="h-1.5 w-1.5 rounded-full bg-[#9A55FF] junimo-bounce"></div>
          </div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};
