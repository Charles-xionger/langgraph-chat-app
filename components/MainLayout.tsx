"use client";
import { ReactNode, useCallback, useState } from "react";
import Sidebar from "./Siderbar";
import Header from "./Header";
import { ThreadList } from "./ThreadList";
import GhostIconButton from "./GhostIconButton";
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import Junimo from "./Junimo";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <main className="h-screen w-full bg-[#FFFAE6] text-[#451806] dark:bg-[#E8DCC0] dark:text-[#2C1810]">
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
          <ThemeToggle />
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
          <ThreadList />
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
    </main>
  );
}
