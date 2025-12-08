"use client";

import { getEnergyStatus } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EnergyDisplayProps {
  tokens: number;
  messageCount?: number;
}

export default function EnergyDisplay({
  tokens,
  messageCount = 0,
}: EnergyDisplayProps) {
  const status = getEnergyStatus(tokens);
  const maxEnergy = 12000; // 设置一个合理的最大值
  const energyPercentage = Math.min((tokens / maxEnergy) * 100, 100);
  const avgTokensPerMessage =
    messageCount > 0 ? Math.round(tokens / messageCount) : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-help group">
          <span
            className={`${status.color} text-[11px] group-hover:scale-110 transition-transform`}
          >
            {status.icon}
          </span>

          {/* 能量条 */}
          <div className="w-20 h-2 bg-[#8B4513]/30 dark:bg-[#4a3728] rounded-full overflow-hidden border border-[#552814] dark:border-[#8B6F47]">
            <div
              className={`h-full bg-gradient-to-r ${status.barColor} transition-all duration-500 ease-out`}
              style={{ width: `${energyPercentage}%` }}
            />
          </div>

          {/* Token 数字 */}
          <span
            className={`${status.color} text-[10px] tabular-nums font-medium`}
          >
            {tokens.toLocaleString()}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="stardew-box w-64 p-0 border-4 border-[#552814] dark:border-[#8B6F47]"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b-4 border-[#552814] dark:border-[#8B6F47]">
          <div className="flex items-center gap-2">
            <span className="text-lg">{status.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
                能量消耗
              </div>
              <div className={`text-xs ${status.color}`}>
                状态: {status.label}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
              总消耗
            </span>
            <span className="font-mono font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
              {tokens.toLocaleString()} tokens
            </span>
          </div>

          {messageCount > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                  消息数量
                </span>
                <span className="font-mono font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
                  {messageCount} 条
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                  平均消耗
                </span>
                <span className="font-mono font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
                  {avgTokensPerMessage} tokens/条
                </span>
              </div>
            </>
          )}

          <div className="pt-2 border-t-2 border-[#552814] dark:border-[#8B6F47]">
            <div className="flex justify-between items-center">
              <span className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                能量等级
              </span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-[#8B4513]/30 dark:bg-[#4a3728] rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${status.barColor}`}
                    style={{ width: `${energyPercentage}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono">
                  {Math.round(energyPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#F2E6C2]/50 dark:bg-[#2a2f3e] border-t-4 border-[#552814] dark:border-[#8B6F47]">
          <div className="text-[10px] text-[--stardew-wood] dark:text-[--stardew-wood-light]">
            💡 使用 GPT-Tokenizer 精确计算
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
