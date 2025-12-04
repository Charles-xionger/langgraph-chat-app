"use client";

import { useCodeTheme, CodeTheme } from "@/contexts/CodeThemeContext";
import { Palette } from "lucide-react";
import { useState } from "react";

const themeOptions: { value: CodeTheme; label: string; colors: string[] }[] = [
  {
    value: "dracula",
    label: "Dracula",
    colors: ["#ff79c6", "#8be9fd", "#50fa7b", "#ffb86c"],
  },
  {
    value: "oneDark",
    label: "One Dark",
    colors: ["#61afef", "#98c379", "#e06c75", "#d19a66"],
  },
  {
    value: "vscDarkPlus",
    label: "VS Code Dark+",
    colors: ["#569cd6", "#4ec9b0", "#ce9178", "#dcdcaa"],
  },
  {
    value: "atomDark",
    label: "Atom Dark",
    colors: ["#96cbfe", "#a8ff60", "#ff73fd", "#ffc600"],
  },
  {
    value: "nightOwl",
    label: "Night Owl",
    colors: ["#c792ea", "#82aaff", "#addb67", "#ecc48d"],
  },
  {
    value: "githubDark",
    label: "GitHub Dark",
    colors: ["#79c0ff", "#56d364", "#ffa657", "#f85149"],
  },
];

export const CodeThemeSelector = () => {
  const { theme, setTheme } = useCodeTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
        title="选择代码主题"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Code 主题</span>
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-border bg-background shadow-lg">
            <div className="p-2 space-y-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    theme === option.value ? "bg-accent" : ""
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <div className="flex gap-1">
                    {option.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
