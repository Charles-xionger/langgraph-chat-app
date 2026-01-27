"use client";

import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { MCPConfigPanel, MCPConfig } from "@/components/mcp";
import { X } from "lucide-react";
import { useModelStore } from "@/stores/modelStore";

interface MCPConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MCPConfigDialog({ open, onOpenChange }: MCPConfigDialogProps) {
  const [mcpConfigs, setMcpConfigs] = useState<MCPConfig[]>([]);
  const [isMcpLoading, setIsMcpLoading] = useState(false);
  const {
    mcpConfigs: selectedConfigs,
    addMcpConfig,
    removeMcpConfig,
    updateMcpConfig,
  } = useModelStore();

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

  // 配置保存成功后的回调
  const handleConfigSaved = async (id: string) => {
    // 如果这个配置已经被选中，需要更新 modelStore 中的数据
    const isSelected = selectedConfigs.some((config) => config.id === id);
    if (isSelected) {
      try {
        const response = await fetch(`/api/mcp/configs/${id}`);
        if (response.ok) {
          const data = await response.json();
          const config = data.config;
          console.log("🔄 Updating selected MCP config:", {
            id,
            url: config?.url,
            headers: config?.headers,
          });
          updateMcpConfig(id, {
            url: config?.url || "",
            headers: config?.headers || undefined,
          });
        }
      } catch (error) {
        console.error("Error fetching updated MCP config:", error);
      }
    }
  };

  // 配置删除成功后的回调
  const handleConfigDeleted = (id: string) => {
    console.log("🗑️ Removing deleted MCP config from store:", id);
    removeMcpConfig(id);
  };

  useEffect(() => {
    if (open) {
      fetchMcpConfigs();
    }
  }, [open]);

  const handleSelect = async (id: string | null) => {
    if (!id) {
      // 选择"不使用 MCP"，清空所有配置
      selectedConfigs.forEach((config) => {
        removeMcpConfig(config.id);
      });
      return;
    }

    // 检查是否已经选中
    const isSelected = selectedConfigs.some((config) => config.id === id);

    if (isSelected) {
      // 如果已选中，则移除
      console.log("🔌 Removing MCP config:", id);
      removeMcpConfig(id);
    } else {
      // 如果未选中，则添加
      try {
        const response = await fetch(`/api/mcp/configs/${id}`);
        if (response.ok) {
          const data = await response.json();
          const config = data.config;
          console.log("🔌 Adding MCP config:", {
            id,
            url: config?.url,
            headers: config?.headers,
          });
          addMcpConfig({
            id,
            url: config?.url || "",
            headers: config?.headers || undefined,
          });
        } else {
          console.error("Failed to fetch MCP config");
        }
      } catch (error) {
        console.error("Error fetching MCP config:", error);
      }
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
              selectedIds={selectedConfigs.map((c) => c.id)}
              isLoading={isMcpLoading}
              onSelect={handleSelect}
              onRefresh={fetchMcpConfigs}
              onConfigSaved={handleConfigSaved}
              onConfigDeleted={handleConfigDeleted}
            />
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
