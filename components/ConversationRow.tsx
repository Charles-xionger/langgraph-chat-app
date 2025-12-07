"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Trash2, Star } from "lucide-react";
import { cls, timeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationData {
  id: string;
  title: string;
  updatedAt: string | Date;
  pinned?: boolean;
  messages?: any[];
  messageCount?: number;
  preview?: string;
}

interface ConversationRowProps {
  data: ConversationData;
  active: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  showMeta?: boolean;
}

export default function ConversationRow({
  data,
  active,
  onSelect,
  onTogglePin,
  onRename,
  onDelete,
  showMeta,
}: ConversationRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(data.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const count = Array.isArray(data.messages)
    ? data.messages.length
    : data.messageCount;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    setIsRenaming(true);
    setShowMenu(false);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== data.title) {
      onRename(data.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setRenameValue(data.title);
      setIsRenaming(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${data.title}"? This action cannot be undone.`)) {
      onDelete(data.id);
    }
    setShowMenu(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        className={cls(
          "flex w-full items-center gap-2 rounded px-2 py-2 text-left transition-all",
          active
            ? "inventory-slot active"
            : "hover:bg-[#C78F56]/20 dark:hover:bg-[#C78F56]/10"
        )}
        title={data.title}
      >
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border-2 border-[#9A55FF] bg-[#FFFAE6] dark:bg-[#F5EDD6] px-1 py-0.5 text-sm font-medium outline-none text-[#451806] dark:text-[#2C1810]"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium tracking-tight text-[#451806] dark:text-[#2C1810]">
                {data.title}
              </span>
              <span className="shrink-0 text-[11px] text-[#A05030] dark:text-[#6B4423]">
                {timeAgo(data.updatedAt)}
              </span>
            </div>
          )}
          {showMeta && !isRenaming && (
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#A05030] dark:text-[#6B4423]">
              <span>{count} messages</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {data.pinned && (
            <Star className="h-3.5 w-3.5 text-[#FFD700] fill-[#FFD700]" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded p-1 text-[#A05030] dark:text-[#6B4423] opacity-0 transition group-hover:opacity-100 hover:bg-[#C78F56]/30"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </button>

      <AnimatePresence>
        {showMenu && (
          <div ref={menuRef}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full z-100 mt-1 w-44 stardew-box rounded p-1"
            >
              {/* Star/Unstar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]"
              >
                <Star
                  className={cls(
                    "h-3.5 w-3.5",
                    data.pinned && "fill-[#FFD700] text-[#FFD700]"
                  )}
                />
                {data.pinned ? "Unstar" : "Star"}
              </button>

              {/* Rename */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>

              <div className="my-1 border-t-2 border-[#552814]/30 dark:border-[#C78F56]/30" />

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview tooltip */}
      <div className="pointer-events-none absolute left-[calc(100%+6px)] top-1 hidden w-64 stardew-box rounded p-3 text-xs text-[#451806] dark:text-[#2C1810] md:group-hover:block">
        <div className="line-clamp-6 whitespace-pre-wrap">{data.preview}</div>
      </div>
    </div>
  );
}
