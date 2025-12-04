"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  useGetThreads,
  useCreateThread,
  useUpdateThreadTitle,
  useDeleteThread,
} from "@/app/api/agent/server-store";
import { Button } from "@/components/ui/button";
import { Thread } from "@/types/message";
import { Check, X, Edit2, Trash2 } from "lucide-react";

export const ThreadList = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // 从路径中提取当前的 threadId
  const currentThreadId = pathname?.startsWith("/thread/")
    ? pathname.split("/")[2]
    : null;

  // 获取线程列表
  const { data: threads, isLoading, error } = useGetThreads();

  // 创建线程
  const createThreadMutation = useCreateThread((newThread: Thread) => {
    // 创建成功后跳转到新线程
    router.push(`/thread/${newThread.id}`);
  });

  // 更新线程标题
  const updateThreadMutation = useUpdateThreadTitle();

  // 删除线程
  const deleteThreadMutation = useDeleteThread();

  // 处理创建新线程
  const handleCreateThread = () => {
    createThreadMutation.mutate();
  };

  // 处理点击线程项，跳转到对应线程
  const handleThreadClick = (threadId: string) => {
    if (editingId !== threadId) {
      router.push(`/thread/${threadId}`);
    }
  };

  // 开始编辑标题
  const handleStartEdit = (thread: Thread, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发线程点击事件
    setEditingId(thread.id);
    setEditTitle(thread.title || "");
  };

  // 保存编辑的标题
  const handleSaveEdit = (threadId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      updateThreadMutation.mutate(
        { threadId, title: editTitle.trim() },
        {
          onSuccess: () => {
            setEditingId(null);
            setEditTitle("");
          },
        }
      );
    } else {
      setEditingId(null);
    }
  };

  // 取消编辑
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle("");
  };

  // 处理删除线程
  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发线程点击事件
    if (confirm("确定要删除这个对话吗？")) {
      deleteThreadMutation.mutate(threadId);
    }
  };

  // 处理键盘事件（Enter 保存，Escape 取消）
  const handleKeyDown = (
    threadId: string,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleSaveEdit(threadId);
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditTitle("");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-destructive">
          加载失败: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 创建新线程按钮 */}
      <div className="p-4 border-b">
        <Button
          onClick={handleCreateThread}
          disabled={createThreadMutation.isPending}
          className="w-full"
        >
          {createThreadMutation.isPending ? "创建中..." : "+ 新建对话"}
        </Button>
      </div>

      {/* 线程列表 */}
      <div className="flex-1 overflow-y-auto">
        {threads && threads.length > 0 ? (
          <div className="p-2 space-y-1">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className={`group relative flex items-center gap-2 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                  currentThreadId === thread.id
                    ? "bg-accent border border-border"
                    : ""
                }`}
              >
                {editingId === thread.id ? (
                  // 编辑模式
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(thread.id, e)}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => handleSaveEdit(thread.id, e)}
                      disabled={updateThreadMutation.isPending}
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  // 显示模式
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {thread.title || "未命名对话"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(thread.updatedAt).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={(e) => handleStartEdit(thread, e)}
                        title="编辑标题"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteThread(thread.id, e)}
                        disabled={deleteThreadMutation.isPending}
                        title="删除对话"
                        className="hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            暂无对话，点击上方按钮创建新对话
          </div>
        )}
      </div>
    </div>
  );
};
