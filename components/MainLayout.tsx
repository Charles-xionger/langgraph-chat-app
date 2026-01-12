"use client";
import { ReactNode, useCallback, useState } from "react";
import Sidebar from "./Siderbar";
import Header from "./Header";
import { ThreadList } from "./ThreadList";
import GhostIconButton from "./GhostIconButton";
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react";
import Junimo from "./Junimo";
import SearchModal from "./SearchModal";
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

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<{
    id: string;
    title: string;
    onConfirm: () => void;
  } | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleDeleteRequest = useCallback(
    (threadId: string, threadTitle: string, onConfirm: () => void) => {
      setThreadToDelete({ id: threadId, title: threadTitle, onConfirm });
      setDeleteDialogOpen(true);
    },
    []
  );

  const confirmDelete = useCallback(() => {
    if (threadToDelete) {
      threadToDelete.onConfirm();
    }
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  }, [threadToDelete]);

  return (
    <main className="h-screen w-full bg-[#FFFAE6] text-[#451806] dark:bg-[#1a1f2e] dark:text-[#F2E6C2]">
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 stardew-box px-3 py-2">
        <div className="ml-1 flex items-center gap-2 text-sm font-bold tracking-tight pixel-text">
          <span className="text-[#5DCC52]">★</span> Stardew Assistant
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
        </div>
      </div>
      {/* Sidebar */}
      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1400px]">
        <Sidebar
          open={isSidebarOpen}
          toggle={toggleSidebar}
          onClose={() => setSidebarOpen(false)}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          setShowSearchModal={setShowSearchModal}
        >
          {/* thread List */}
          <ThreadList onDeleteRequest={handleDeleteRequest} />
        </Sidebar>

        {/* Main Content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* header */}
          <Header />

          {/* Main Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>

        <div className="fixed bottom-4 right-10 opacity-50 hover:opacity-100 transition-opacity hidden md:block">
          <Junimo color="green" />
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[--stardew-cream]! dark:bg-[--stardew-dark-bg]! stardew-box border-4 border-[--stardew-wood-dark]! dark:border-[#8B6F47]!">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[--stardew-text] dark:text-[--stardew-parchment] pixel-text-sm">
              🗑️ Delete Thread
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[--stardew-wood] dark:text-[--stardew-wood-light]">
              Are you sure you want to delete "{threadToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="stardew-btn bg-[#8B7355]! hover:bg-[#A05030]! dark:bg-[#6B4423]! dark:hover:bg-[#8B7355]! text-white border-[#6B4423] dark:border-[#552814]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="stardew-btn bg-linear-to-b! from-[#D84545]! to-[#B83838]! hover:from-[#E05555]! hover:to-[#C84848]! dark:from-[#B83838]! dark:to-[#A02828]! dark:hover:from-[#C84848]! dark:hover:to-[#B03838]! text-white border-[#8B2828] dark:border-[#6B1818]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
