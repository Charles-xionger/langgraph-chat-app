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
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ReactNode } from "react";

export default function SettingsPopover({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 stardew-box !rounded-lg border-none"
        align="start"
        side="top"
      >
        <div className="p-4">
          <div className="text-sm text-[#6B4423] dark:text-[#4A2818] mb-3">
            farmer@pelican-town.valley
          </div>

          <div className="flex items-center gap-3 p-3 inventory-slot rounded mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#5DCC52]" />
              <span className="text-sm font-bold text-[#451806] dark:text-[#2C1810]">
                Personal Farm
              </span>
            </div>
            <div className="ml-auto">
              <div className="text-xs text-[#FFD700] font-bold">Joja+ Plan</div>
            </div>
            <div className="text-[#5DCC52]">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold text-[#451806] dark:text-[#2C1810] mb-2 pixel-text">
              Settings
            </div>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]">
              <Globe className="h-4 w-4 text-[#4A90D9]" />
              <span>Language</span>
              <ChevronRight className="h-4 w-4 ml-auto text-[#6B4423] dark:text-[#6B4423]" />
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]">
              <HelpCircle className="h-4 w-4 text-[#9A55FF]" />
              <span>Get help</span>
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]">
              <Crown className="h-4 w-4 text-[#FFD700]" />
              <span>Upgrade plan</span>
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]">
              <BookOpen className="h-4 w-4 text-[#6B4423] dark:text-[#6B4423]" />
              <span>Learn more</span>
              <ChevronRight className="h-4 w-4 ml-auto text-[#6B4423] dark:text-[#6B4423]" />
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]">
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
