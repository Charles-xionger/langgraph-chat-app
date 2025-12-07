"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="inline-flex items-center gap-2 inventory-slot rounded px-2.5 py-1.5 text-sm hover:bg-[#C78F56]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A55FF] text-[#451806] dark:text-[#2C1810]"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-[#FFD700]" />
      ) : (
        <Moon className="h-4 w-4 text-[#9A55FF]" />
      )}
      <span className="hidden sm:inline font-medium">
        {theme === "dark" ? "Day" : "Night"}
      </span>
    </button>
  );
}
