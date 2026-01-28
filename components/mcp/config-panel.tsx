"use client";

import { useState } from "react";
import { X, Plus, Edit2, Trash2, ChevronDown, Wrench } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface MCPConfig {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  headers?: Record<string, string> | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MCPConfigPanelProps {
  configs: MCPConfig[];
  selectedIds?: string[];
  isLoading: boolean;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
  onConfigSaved?: (id: string) => void;
  onConfigDeleted?: (id: string) => void;
}

export function MCPConfigPanel({
  configs,
  selectedIds = [],
  isLoading,
  onSelect,
  onRefresh,
  onConfigSaved,
  onConfigDeleted,
}: MCPConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<MCPConfig> | null>(
    null,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });

  const selectedConfig = configs.find((c) => selectedIds.includes(c.id));

  const handleAdd = () => {
    setEditingConfig({
      name: "",
      url: "",
      description: "",
      enabled: true,
    });
    setIsEditing(true);
  };

  const handleEdit = (config: MCPConfig) => {
    setEditingConfig(config);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editingConfig?.name || !editingConfig?.url) {
      setErrorDialog({
        open: true,
        title: "验证失败",
        message: "名称和 URL 是必填项",
      });
      return;
    }

    // 验证 headers 是否为有效的 JSON
    let parsedHeaders = undefined;
    if (editingConfig.headers) {
      try {
        const headersStr =
          typeof editingConfig.headers === "string"
            ? editingConfig.headers
            : JSON.stringify(editingConfig.headers);
        if (headersStr.trim()) {
          parsedHeaders = JSON.parse(headersStr);
          // 确保是一个对象
          if (
            typeof parsedHeaders !== "object" ||
            Array.isArray(parsedHeaders)
          ) {
            throw new Error("Headers 必须是一个对象");
          }
        }
      } catch (error) {
        setErrorDialog({
          open: true,
          title: "Headers 格式错误",
          message:
            error instanceof Error ? error.message : "必须是有效的 JSON 格式",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const configToSave = {
        ...editingConfig,
        headers: parsedHeaders,
      };

      if (editingConfig.id) {
        // 更新
        const response = await fetch(`/api/mcp/configs/${editingConfig.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(configToSave),
        });
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("配置不存在，可能已被删除");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "更新失败");
        }
      } else {
        // 创建
        const response = await fetch("/api/mcp/configs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(configToSave),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "创建失败");
        }
      }
      onRefresh();
      setIsEditing(false);
      setEditingConfig(null);

      // 通知父组件配置已保存，需要更新已选中的配置
      if (onConfigSaved && editingConfig.id) {
        onConfigSaved(editingConfig.id);
      }
    } catch (error) {
      console.error("保存失败:", error);
      setErrorDialog({
        open: true,
        title: "保存失败",
        message: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/configs/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn("配置已经不存在");
          // 即使404，也刷新列表以同步状态
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "删除失败");
        }
      }
      // 删除后会通过 onConfigDeleted 自动从 modelStore 移除，不需要手动调用 onSelect
      onRefresh();
      setDeleteId(null);

      // 通知父组件配置已删除，需要从 modelStore 中移除
      if (onConfigDeleted) {
        onConfigDeleted(id);
      }
    } catch (error) {
      console.error("删除失败:", error);
      setErrorDialog({
        open: true,
        title: "删除失败",
        message: error instanceof Error ? error.message : "请重试",
      });
    }
  };

  return (
    <div className="relative mb-4">
      {/* 选择器 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 stardew-box rounded border-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] hover:bg-[#C78F56]/10 transition-colors"
      >
        <Wrench className="h-4 w-4 text-[--stardew-wood]" />
        <span className="text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment]">
          {isLoading
            ? "加载中..."
            : selectedConfig
              ? selectedConfig.name
              : "未使用 MCP"}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[--stardew-wood] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 配置面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 stardew-box rounded-lg border-4 border-[--stardew-wood-dark] dark:border-[#8B6F47] z-50 bg-[--stardew-cream] dark:bg-[--stardew-dark-bg] shadow-lg">
          <div className="p-4">
            {/* 标题和关闭按钮 */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[--stardew-text] dark:text-[--stardew-parchment] pixel-text-sm">
                🔧 MCP 工具配置
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#C78F56]/20 rounded transition-colors"
              >
                <X className="h-4 w-4 text-[--stardew-wood]" />
              </button>
            </div>

            {/* 配置列表 */}
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {/* 不使用 MCP */}
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded border-2 transition-colors ${
                  selectedIds.length === 0
                    ? "border-[--stardew-green] bg-[--stardew-green]/10"
                    : "border-[--stardew-wood-light] hover:bg-[#C78F56]/10"
                }`}
              >
                <div className="text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment]">
                  不使用 MCP
                </div>
              </button>

              {/* 配置列表 */}
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`relative group p-3 rounded border-2 transition-colors ${
                    selectedIds.includes(config.id)
                      ? "border-[--stardew-green] bg-[--stardew-green]/10"
                      : "border-[--stardew-wood-light] hover:bg-[#C78F56]/10"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelect(config.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment]">
                      {config.name}
                    </div>
                    {config.description && (
                      <div className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light] mt-1">
                        {config.description}
                      </div>
                    )}
                    <div className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light] mt-1 opacity-60">
                      {config.url}
                    </div>
                  </button>

                  {/* 操作按钮 */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(config);
                      }}
                      className="p-1 hover:bg-[--stardew-blue]/20 rounded"
                      title="编辑"
                    >
                      <Edit2 className="h-3 w-3 text-[--stardew-blue]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(config.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="删除"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 添加按钮 */}
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-[--stardew-wood-dark] dark:border-[#8B6F47] rounded hover:bg-[#C78F56]/10 transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">添加 MCP 配置</span>
            </button>
          </div>
        </div>
      )}

      {/* 编辑表单对话框 */}
      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            // 点击蒙版关闭
            if (e.target === e.currentTarget) {
              setIsEditing(false);
              setEditingConfig(null);
            }
          }}
        >
          <div className="w-full max-w-md stardew-box rounded-lg border-4 border-[--stardew-wood-dark] dark:border-[#8B6F47] bg-[--stardew-cream] dark:bg-[--stardew-dark-bg] p-6">
            <h3 className="text-lg font-bold text-[--stardew-text] dark:text-[--stardew-parchment] mb-4 pixel-text-sm">
              {editingConfig?.id ? "编辑 MCP 配置" : "添加 MCP 配置"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment] mb-1">
                  名称 *
                </label>
                <input
                  type="text"
                  value={editingConfig?.name || ""}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-[--stardew-wood-light] rounded bg-white dark:bg-[--stardew-dark-bg] text-[#451806] dark:text-[--stardew-parchment] placeholder:text-[#A05030] placeholder:opacity-60"
                  placeholder="如: Drawing Server"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment] mb-1">
                  URL *
                </label>
                <input
                  type="text"
                  value={editingConfig?.url || ""}
                  onChange={(e) =>
                    setEditingConfig({ ...editingConfig, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-[--stardew-wood-light] rounded bg-white dark:bg-[--stardew-dark-bg] text-[#451806] dark:text-[--stardew-parchment] placeholder:text-[#A05030] placeholder:opacity-60"
                  placeholder="http://localhost:3001/sse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment] mb-1">
                  描述
                </label>
                <textarea
                  value={editingConfig?.description || ""}
                  onChange={(e) =>
                    setEditingConfig({
                      ...editingConfig,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-[--stardew-wood-light] rounded bg-white dark:bg-[--stardew-dark-bg] text-[#451806] dark:text-[--stardew-parchment] placeholder:text-[#A05030] placeholder:opacity-60"
                  rows={3}
                  placeholder="可选的描述信息"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment] mb-1">
                  鉴权 Headers (JSON)
                </label>
                <textarea
                  value={
                    editingConfig?.headers
                      ? typeof editingConfig.headers === "string"
                        ? editingConfig.headers
                        : JSON.stringify(editingConfig.headers, null, 2)
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    try {
                      const parsed = value.trim() ? JSON.parse(value) : null;
                      setEditingConfig({
                        ...editingConfig,
                        headers: parsed,
                      });
                    } catch (error) {
                      // Temporarily store the invalid JSON string to allow the user to fix it
                      setEditingConfig({
                        ...editingConfig,
                        headers: value as any,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border-2 border-[--stardew-wood-light] rounded bg-white dark:bg-[--stardew-dark-bg] text-[#451806] dark:text-[--stardew-parchment] placeholder:text-[#A05030] placeholder:opacity-60 font-mono text-xs"
                  rows={4}
                  placeholder={'{\n  "Authorization": "Bearer your_token"\n}'}
                />
                <div className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light] mt-1">
                  可选，用于 API 鉴权的 HTTP Headers，需要填写有效的 JSON 格式
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingConfig(null);
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] rounded hover:bg-[#C78F56]/10 transition-colors text-[--stardew-text] dark:text-[--stardew-parchment]"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-[--stardew-green] hover:bg-[--stardew-green]/80 text-[#FFFAE6] dark:text-white rounded transition-colors disabled:opacity-50"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent className="bg-[--stardew-cream]! dark:bg-[--stardew-dark-bg]! stardew-box border-4 border-[--stardew-wood-dark]! dark:border-[#8B6F47]!">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[--stardew-text] dark:text-[--stardew-parchment] pixel-text-sm">
              确认删除
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
              确定要删除这个 MCP 配置吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-[--stardew-wood-dark] dark:border-[#8B6F47] text-[--stardew-text] dark:text-[--stardew-parchment] hover:bg-[#C78F56]/10 bg-white! dark:bg-[--stardew-dark-bg]!">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-500! hover:bg-red-600! text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 错误提示对话框 */}
      <AlertDialog
        open={errorDialog.open}
        onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
      >
        <AlertDialogContent className="bg-[--stardew-cream]! dark:bg-[--stardew-dark-bg]! stardew-box border-4 border-[--stardew-wood-dark]! dark:border-[#8B6F47]!">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[--stardew-text] dark:text-[--stardew-parchment] pixel-text-sm">
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
              className="bg-[--stardew-green]! hover:bg-[--stardew-green]/80! text-white"
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
