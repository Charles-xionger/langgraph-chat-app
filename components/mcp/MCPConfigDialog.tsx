"use client";

import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { MCPConfigPanel, MCPConfig } from "@/components/mcp";
import { X } from "lucide-react";

interface MCPConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MCPConfigDialog({ open, onOpenChange }: MCPConfigDialogProps) {
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [selectedMcpId, setSelectedMcpId] = useState<string | null>(null);
  const [isMcpLoading, setIsMcpLoading] = useState(false);

  // 获取 MCP 配置列表
  const fetchMcpConfigs = async () => {
    setIsMcpLoading(true);
    try {
      const response = await fetch("/api/mcp/configs");
      if (response.ok) {
        const data = await response.json();
        setMcpConfigs(data.configs || []);
      }
    } catch (error) {
      console.error("Failed to fetch MCP configs:", error);
    } finally {
      setIsMcpLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMcpConfigs();
      // 从 localStorage 加载上次选择的配置
      const saved = localStorage.getItem("selectedMcpId");
      if (saved) {
        setSelectedMcpId(saved);
      }
    }
  }, [open]);

  const handleSelect = (id: string | null) => {
    setSelectedMcpId(id);
    // 保存到 localStorage
    if (id) {
      localStorage.setItem("selectedMcpId", id);
    } else {
      localStorage.removeItem("selectedMcpId");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="stardew-box max-w-2xl border-4 border-[--stardew-wood-dark] dark:border-[#8B6F47] bg-[--stardew-cream] dark:bg-[--stardew-dark-bg]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[--stardew-text] dark:text-[--stardew-parchment] pixel-text-sm">
              🔧 MCP 工具配置
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 hover:bg-[#C78F56]/20 rounded transition-colors"
            >
              <X className="h-5 w-5 text-[--stardew-wood]" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light] mb-4">
              MCP (Model Context Protocol) 允许 AI
              调用外部工具来扩展功能，如绘图、天气查询等。
            </p>
            <MCPConfigPanel
              configs={mcpConfigs}
              selectedId={selectedMcpId}
              isLoading={isMcpLoading}
              onSelect={handleSelect}
              onRefresh={fetchMcpConfigs}
            />
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
