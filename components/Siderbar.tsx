import React, { useEffect } from "react";
import {
  PanelLeftClose,
  MessageSquare,
  PanelLeftOpen,
  Plus,
  SearchIcon,
  FolderIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SettingsPopover from "./SettingsPopover";
import { useRouter } from "next/navigation";
import { useCreateThread } from "@/app/api/agent/server-store";
import { Thread } from "@/types/message";
import { useSession, signOut } from "next-auth/react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

function StardewStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-[#FFD700] sparkle"
      fill="currentColor"
    >
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
    </svg>
  );
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  toggle: () => void;
  children?: React.ReactNode;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setShowSearchModal: (show: boolean) => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  open,
  onClose,
  toggle,
  children,
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
  setShowSearchModal,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  // 创建线程
  const createThreadMutation = useCreateThread((newThread: Thread) => {
    // 创建成功后跳转到新线程
    router.push(`/thread/${newThread.id}`);
  });

  // 处理创建新线程
  const handleCreateThread = () => {
    createThreadMutation.mutate();
  };

  // Close sidebar on escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) toggle();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, toggle]);

  if (sidebarCollapsed) {
    return (
      <aside className="z-50 flex h-full w-16 shrink-0 flex-col stardew-box rounded-none! outline-none! border-r-4 transition-all duration-300">
        <div className="flex items-center justify-center border-b-4 border-[#552814] dark:border-[#8B6F47] px-3 py-3">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={handleCreateThread}
            disabled={createThreadMutation.isPending}
            className="rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF] disabled:opacity-50 disabled:cursor-not-allowed"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowSearchModal?.(true)}
            className="rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
            title="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            className="rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
            title="Folders"
          >
            <FolderIcon className="h-5 w-5" />
          </button>

          <div className="mt-auto mb-4">
            <SettingsPopover>
              <button
                className="rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </SettingsPopover>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#421808]/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <aside
            key="sidebar"
            className="fixed inset-y-0 left-0 z-50 flex h-full w-80 flex-col stardew-box rounded-none! outline-none! border-r-4 md:relative md:translate-x-0"
          >
            {/* Header */}
            <div className="flex items-center gap-2 border-b-4 border-[#552814] dark:border-[#8B6F47] px-3 py-3">
              <div className="flex items-center gap-2">
                <StardewStar />
                <div className="text-base font-bold tracking-tight pixel-text text-[#451806] dark:text-[#F2E6C2]">
                  Stardew Assistant
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:block rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>

                <button
                  onClick={onClose}
                  className="md:hidden rounded p-2 hover:bg-[#C78F56]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF]"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-3">
              <label htmlFor="search" className="sr-only">
                Search conversations
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B4423] dark:text-[#8B7355]" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search the valley..."
                  onClick={() => setShowSearchModal(true)}
                  onFocus={() => setShowSearchModal(true)}
                  className="w-full inventory-slot rounded py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[#6B4423]/70 dark:placeholder:text-[#8B7355]/70 focus:ring-2 focus:ring-[#9A55FF] bg-[#FFFAE6] dark:bg-[#2a2f3e] text-[#451806] dark:text-[#F2E6C2]"
                />
              </div>
            </div>

            {/* New Chat Button */}
            <div className="px-3 pt-3">
              <button
                onClick={handleCreateThread}
                disabled={createThreadMutation.isPending}
                className="flex w-full items-center justify-center gap-2 stardew-btn rounded px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="New Chat"
              >
                <Plus className="h-4 w-4" />
                {createThreadMutation.isPending
                  ? "创建中..."
                  : "Start New Adventure"}
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
              {children}
            </nav>

            {/* Footer */}
            <div className="mt-auto border-t-4 border-[#552814] dark:border-[#8B6F47] px-3 py-3">
              <div className="flex items-center gap-2">
                <SettingsPopover>
                  <button className="inline-flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-[#C78F56]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF] text-[#451806] dark:text-[#F2E6C2]">
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                </SettingsPopover>
              </div>
              {/* User profile */}
              {session?.user && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="mt-2 w-full flex items-center gap-2 inventory-slot rounded p-2 hover:bg-[#C78F56]/20 transition-colors">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#FFD700] shadow-sm">
                        {session.user.image ? (
                          <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center text-white font-bold text-sm">
                            {session.user.name?.[0]?.toUpperCase() ||
                              session.user.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-bold text-[#451806] dark:text-[#F2E6C2]">
                          {session.user.name || "User"}
                        </div>
                        <div className="truncate text-xs text-[#6B4423] dark:text-[#8B7355]">
                          {session.user.email}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    className="w-64 stardew-box p-0 overflow-hidden"
                  >
                    <div className="p-3 border-b-2 border-[#552814] dark:border-[#8B6F47]">
                      <div className="text-sm font-bold text-[#451806] dark:text-[#F2E6C2]">
                        {session.user.name}
                      </div>
                      <div className="text-xs text-[#6B4423] dark:text-[#8B7355] truncate">
                        {session.user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#451806] dark:text-[#F2E6C2] hover:bg-[#C78F56]/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>登出</span>
                    </button>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* footer */}
    </>
  );
};

export default SidebarComponent;
