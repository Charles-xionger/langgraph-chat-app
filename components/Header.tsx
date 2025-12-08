"use client";
import { MoreHorizontal } from "lucide-react";
import GhostIconButton from "./GhostIconButton";
import { timeAgo, estimateTokens } from "@/lib/utils";
import { useThreadContext } from "@/contexts/ThreadContext";
import EnergyDisplay from "./EnergyDisplay";

export default function Header() {
  const { currentThread } = useThreadContext();

  const tokens = currentThread?.messages
    ? estimateTokens(currentThread.messages)
    : 0;

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 stardew-box rounded-none border-b-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        {currentThread ? (
          <>
            <h1 className="truncate text-base font-bold tracking-tight pixel-text text-[#451806] dark:text-[#F2E6C2]">
              {currentThread.title || "未命名对话"}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-[#A05030] dark:text-[#C78F56]">
              <span>{timeAgo(currentThread.updatedAt)}</span>
              <span className="text-[#FFD700]">★</span>
              <EnergyDisplay
                tokens={tokens}
                messageCount={currentThread.messages?.length ?? 0}
              />
            </div>
          </>
        ) : (
          <>
            <h1 className="truncate text-base font-bold tracking-tight pixel-text text-[#451806] dark:text-[#F2E6C2]">
              Stardew Assistant
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-[#A05030] dark:text-[#C78F56]">
              <span>开始新的冒险</span>
              <span className="text-[#5DCC52]">★</span>
              <span className="text-[#9A55FF]">准备就绪</span>
            </div>
          </>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  );
}
