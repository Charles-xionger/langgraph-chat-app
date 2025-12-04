import React from "react";
import { PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { CodeThemeSelector } from "./CodeThemeSelector";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-4 cursor-pointer rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Toggle navigation"
          >
            <PanelLeftClose size={20} />
          </button>

          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="hidden text-xl font-semibold text-gray-800 sm:block">
                Chat Assistant
              </span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CodeThemeSelector />
        </div>
      </div>
    </header>
  );
};

export default Header;
