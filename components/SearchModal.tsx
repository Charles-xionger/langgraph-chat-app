"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon, MessageSquare, Clock } from "lucide-react";
import { useGetThreads } from "@/app/api/agent/server-store";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: threads } = useGetThreads();

  // 防抖优化
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 自动聚焦
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // 过滤线程
  const filteredThreads = threads?.filter((thread) => {
    if (!debouncedQuery.trim()) return true;
    const query = debouncedQuery.toLowerCase();
    return thread.title?.toLowerCase().includes(query);
  });

  // 处理选择线程
  const handleSelectThread = (threadId: string) => {
    router.push(`/thread/${threadId}`);
    onClose();
    setSearchQuery("");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#421808]/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-2xl -translate-x-1/2 px-4"
          >
            <div className="stardew-box overflow-hidden">
              {/* 搜索输入框 */}
              <div className="flex items-center gap-3 border-b-4 border-[#552814] dark:border-[#8B6F47] p-4">
                <SearchIcon className="h-5 w-5 text-[--stardew-wood] dark:text-[--stardew-wood-light] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索对话记录..."
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-[--stardew-wood]/60 dark:placeholder:text-[--stardew-wood-light]/60 text-[--stardew-text] dark:text-[--stardew-parchment]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="rounded-full p-1 hover:bg-[#C78F56]/20 transition-colors"
                  >
                    <XIcon className="h-4 w-4 text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded p-2 hover:bg-[#C78F56]/20 transition-colors"
                >
                  <XIcon className="h-5 w-5 text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
                </button>
              </div>

              {/* 搜索结果 */}
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredThreads && filteredThreads.length > 0 ? (
                  <div className="p-2">
                    {filteredThreads.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => handleSelectThread(thread.id)}
                        className="w-full text-left rounded p-3 hover:bg-[#C78F56]/10 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 shrink-0">
                            <MessageSquare className="h-4 w-4 text-[--stardew-wood] dark:text-[--stardew-wood-light]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-[--stardew-text] dark:text-[--stardew-parchment] truncate group-hover:text-[#5DCC52]">
                              {thread.title || "未命名对话"}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(thread.updatedAt),
                                  {
                                    addSuffix: true,
                                    locale: zhCN,
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-sm text-[--stardew-wood] dark:text-[--stardew-wood-light]">
                      {searchQuery ? "🔍 未找到相关对话" : "💬 开始输入以搜索"}
                    </div>
                  </div>
                )}
              </div>

              {/* 提示信息 */}
              <div className="border-t-4 border-[#552814] dark:border-[#8B6F47] px-4 py-2">
                <div className="flex items-center gap-4 text-xs text-[--stardew-wood]/70 dark:text-[--stardew-wood-light]/70">
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F2E6C2] dark:bg-[#2a2f3e] text-[--stardew-text] dark:text-[--stardew-parchment] font-mono">
                      ESC
                    </kbd>{" "}
                    关闭
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F2E6C2] dark:bg-[#2a2f3e] text-[--stardew-text] dark:text-[--stardew-parchment] font-mono">
                      ↑
                    </kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#F2E6C2] dark:bg-[#2a2f3e] text-[--stardew-text] dark:text-[--stardew-parchment] font-mono">
                      ↓
                    </kbd>{" "}
                    导航
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
