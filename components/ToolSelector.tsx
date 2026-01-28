"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Wrench, RefreshCw } from "lucide-react";
import { useToolStore, type ToolMetadata } from "@/stores/toolStore";
import { cls } from "@/lib/utils";

interface ToolSelectorProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
}

export default function ToolSelector({
  selectedTools,
  onToolsChange,
}: ToolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { internalTools, mcpTools, loading, error, refreshTools } =
    useToolStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      onToolsChange(selectedTools.filter((id) => id !== toolId));
    } else {
      onToolsChange([...selectedTools, toolId]);
    }
  };

  const selectPreset = (
    preset: "default" | "cad" | "search" | "all" | "none",
  ) => {
    switch (preset) {
      case "default":
        onToolsChange(["internal:get_weather", "internal:calculator"]);
        break;
      case "cad":
        onToolsChange([
          ...mcpTools
            .filter(
              (t) =>
                t.id.includes("cad_") ||
                t.id.includes("oss_") ||
                t.id.includes("excel"),
            )
            .map((t) => t.id),
        ]);
        break;
      case "search":
        onToolsChange(["internal:search_web", "internal:web_browser"]);
        break;
      case "all":
        onToolsChange([
          ...internalTools.map((t) => t.id),
          ...mcpTools.map((t) => t.id),
        ]);
        break;
      case "none":
        onToolsChange([]);
        break;
    }
    setIsOpen(false);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await refreshTools();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 inventory-slot rounded px-2.5 py-1.5 text-xs font-medium text-[#451806] dark:text-[#F2E6C2] hover:bg-[#C78F56]/20 transition-colors"
        title="选择工具"
      >
        <Wrench className="h-3 w-3" />
        <span className="hidden sm:inline">
          {loading ? "加载中..." : `工具 (${selectedTools.length})`}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 w-72 stardew-box rounded p-2 z-50 max-h-96 overflow-y-auto">
          {/* 头部：预设 + 刷新 */}
          <div className="mb-2 pb-2 border-b-2 border-[#C78F56]/30">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-[#A05030] dark:text-[#8B7355] px-1">
                快速预设:
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 rounded hover:bg-[#C78F56]/20 transition-colors disabled:opacity-50"
                title="刷新工具列表"
              >
                <RefreshCw
                  className={cls("h-3 w-3", loading && "animate-spin")}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              <PresetButton onClick={() => selectPreset("default")}>
                基础
              </PresetButton>
              <PresetButton onClick={() => selectPreset("cad")}>
                CAD
              </PresetButton>
              <PresetButton onClick={() => selectPreset("search")}>
                搜索
              </PresetButton>
              <PresetButton onClick={() => selectPreset("all")}>
                全部
              </PresetButton>
              <PresetButton onClick={() => selectPreset("none")}>
                清空
              </PresetButton>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
              <div className="font-medium">加载失败</div>
              <div className="text-[10px] mt-1">{error}</div>
            </div>
          )}

          {/* 内置工具 */}
          {internalTools.length > 0 && (
            <div className="mb-2">
              <div className="text-[10px] text-[#A05030] dark:text-[#8B7355] mb-1 px-1">
                内置工具 ({internalTools.length}):
              </div>
              {internalTools.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  selected={selectedTools.includes(tool.id)}
                  onToggle={() => toggleTool(tool.id)}
                />
              ))}
            </div>
          )}

          {/* MCP 工具 */}
          {mcpTools.length > 0 ? (
            <div>
              <div className="text-[10px] text-[#A05030] dark:text-[#8B7355] mb-1 px-1">
                MCP 工具 ({mcpTools.length}):
              </div>
              {mcpTools.map((tool) => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  selected={selectedTools.includes(tool.id)}
                  onToggle={() => toggleTool(tool.id)}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-xs text-[#A05030] dark:text-[#8B7355] text-center py-2">
                暂无 MCP 工具
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function PresetButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 text-[10px] rounded inventory-slot hover:bg-[#C78F56]/20 transition-colors"
    >
      {children}
    </button>
  );
}

function ToolItem({
  tool,
  selected,
  onToggle,
}: {
  tool: ToolMetadata;
  selected: boolean;
  onToggle: () => void;
}) {
  const getToolIcon = (tool: ToolMetadata) => {
    if (tool.id.includes("weather")) return "🌤️";
    if (tool.id.includes("calculator")) return "🔢";
    if (tool.id.includes("search")) return "🔍";
    if (tool.id.includes("browser")) return "🌐";
    if (tool.id.includes("cad")) return "📐";
    if (tool.id.includes("oss")) return "📁";
    if (tool.id.includes("excel")) return "📊";
    return "🔧";
  };

  return (
    <button
      onClick={onToggle}
      className={cls(
        "w-full flex items-center gap-2 px-2 py-1.5 text-xs text-left rounded hover:bg-[#C78F56]/20 transition-colors",
        selected && "bg-[#C78F56]/30",
      )}
    >
      <div className="shrink-0 w-4 h-4 rounded border-2 border-[#C78F56]/50 flex items-center justify-center">
        {selected && (
          <Check className="h-3 w-3 text-[#451806] dark:text-[#F2E6C2]" />
        )}
      </div>
      <span className="text-sm">{getToolIcon(tool)}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[#451806] dark:text-[#F2E6C2] truncate">
          {tool.name}
        </div>
        <div className="text-[10px] text-[#A05030] dark:text-[#8B7355] truncate">
          {tool.description}
        </div>
      </div>
    </button>
  );
}
