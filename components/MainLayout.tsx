"use client";
import { ReactNode, useCallback, useState } from "react";
import Sidebar from "./Siderbar";
import Header from "./Header";
import { ThreadList } from "./ThreadList";
interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}

      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}>
        {/* thread List */}
        <ThreadList />
      </Sidebar>

      {/* Main Content area */}
      <div className="bg-gray-100 flex flex-1 flex-col transition-all duration-300 ease-in-out">
        {/* header */}
        <div className="z-10">
          <Header toggleSidebar={toggleSidebar} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
