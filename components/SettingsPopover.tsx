"use client";
import { useState } from "react";
import {
  User,
  Globe,
  HelpCircle,
  Crown,
  BookOpen,
  LogOut,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ReactNode } from "react";

export default function SettingsPopover({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 stardew-box rounded-lg border-4 border-[--stardew-wood-dark] dark:border-[#8B6F47]"
        align="start"
        side="top"
      >
        <div className="p-4">
          {/* 邮箱 */}
          <div className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light] mb-3">
            farmer@pelican-town.valley
          </div>

          {/* 账户信息卡片 */}
          <div className="flex items-center gap-3 p-3 inventory-slot rounded mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[--stardew-green]" />
              <span className="text-sm font-bold text-[--stardew-text] dark:text-[--stardew-parchment]">
                Personal Farm
              </span>
            </div>
            <div className="ml-auto">
              <div className="text-xs text-[--stardew-gold] font-bold pixel-text-sm">
                Joja+ Plan
              </div>
            </div>
            <div className="text-[--stardew-green]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* 设置菜单 */}
          <div className="space-y-1">
            <div className="text-sm font-bold text-[--stardew-text] dark:text-[--stardew-parchment] mb-2 pixel-text-sm border-b-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] pb-2">
              ⚙️ Settings
            </div>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10 rounded transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]">
              <Globe className="h-4 w-4 text-[#4FC3F7]" />
              <span>🌍 Language</span>
              <ChevronRight className="h-4 w-4 ml-auto text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10 rounded transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]">
              <Wrench className="h-4 w-4 text-[--stardew-wood]" />
              <span>🔧 MCP Tools</span>
              <ChevronRight className="h-4 w-4 ml-auto text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10 rounded transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]">
              <HelpCircle className="h-4 w-4 text-[--stardew-purple]" />
              <span>❓ Get help</span>
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10 rounded transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]">
              <Crown className="h-4 w-4 text-[--stardew-gold]" />
              <span>👑 Upgrade plan</span>
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10 rounded transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]">
              <BookOpen className="h-4 w-4 text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
              <span>📖 Learn more</span>
              <ChevronRight className="h-4 w-4 ml-auto text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
            </button>

            <div className="border-t-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] my-2"></div>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-red-500/10 rounded transition-colors text-red-600 dark:text-red-400">
              <LogOut className="h-4 w-4" />
              <span>🚪 Log out</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
