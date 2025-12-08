"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  useGetThreads,
  useUpdateThreadTitle,
  useDeleteThread,
} from "@/app/api/agent/server-store";
import { Thread } from "@/types/message";
import ConversationRow from "./ConversationRow";

interface ThreadListProps {
  onDeleteRequest: (
    threadId: string,
    threadTitle: string,
    onConfirm: () => void
  ) => void;
}

export const ThreadList = ({ onDeleteRequest }: ThreadListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pinnedThreads, setPinnedThreads] = useState<Set<string>>(new Set());

  // 从路径中提取当前的 threadId
  const currentThreadId = pathname?.startsWith("/thread/")
    ? pathname.split("/")[2]
    : null;

  // 获取线程列表
  const { data: threads, isLoading, error } = useGetThreads();

  // 更新线程标题
  const updateThreadMutation = useUpdateThreadTitle();

  // 删除线程
  const deleteThreadMutation = useDeleteThread();

  // 处理点击线程项，跳转到对应线程
  const handleThreadClick = (threadId: string) => {
    router.push(`/thread/${threadId}`);
  };

  // 处理 Star/Unstar
  const handleTogglePin = (threadId: string) => {
    setPinnedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  // 处理重命名
  const handleRename = (threadId: string, newTitle: string) => {
    updateThreadMutation.mutate({ threadId, title: newTitle });
  };

  // 请求删除确认
  const handleDeleteRequestInternal = (
    threadId: string,
    threadTitle: string
  ) => {
    onDeleteRequest(threadId, threadTitle, () => {
      deleteThreadMutation.mutate(threadId);
      // 如果删除的是当前线程，跳转到首页
      if (threadId === currentThreadId) {
        router.push("/");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="stardew-box p-3 text-center">
          <div className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light]">
            🌾 加载中...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="stardew-box p-3 text-center border-2 border-red-600 dark:border-red-500">
          <div className="text-sm text-red-700 dark:text-red-400">
            ⚠️ 加载失败: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 线程列表 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {threads && threads.length > 0 ? (
          <div className="px-2 py-1 space-y-1">
            {threads.map((thread) => (
              <ConversationRow
                key={thread.id}
                data={{
                  id: thread.id,
                  title: thread.title || "未命名对话",
                  updatedAt: thread.updatedAt,
                  pinned: pinnedThreads.has(thread.id),
                }}
                active={currentThreadId === thread.id}
                onSelect={() => handleThreadClick(thread.id)}
                onTogglePin={() => handleTogglePin(thread.id)}
                onRename={handleRename}
                onDeleteRequest={handleDeleteRequestInternal}
                showMeta={false}
              />
            ))}
          </div>
        ) : (
          <div className="p-4">
            <div className="stardew-box p-4 text-center">
              <div className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                📝 暂无对话
              </div>
              <div className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light] opacity-70 mt-1">
                点击上方按钮创建新对话
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
