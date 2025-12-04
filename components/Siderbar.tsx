import React, { useEffect } from "react";
import { PanelLeftClose, X, Plus, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  children?: React.ReactNode;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  isOpen,
  toggle,
  children,
}) => {
  // Close sidebar on escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) toggle();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, toggle]);

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -320, // 320px = w-80
          width: isOpen ? 320 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0.0, 0.2, 1], // Custom ease curve
        }}
        className={`fixed top-0 left-0 z-30 h-screen overflow-hidden border-r border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl md:sticky ${
          isOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Subtle border effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ delay: 0.1 }}
          className="absolute right-0 top-0 h-full w-px bg-linear-to-b from-transparent via-gray-200 to-transparent"
        />

        <div className="flex h-full w-80 shrink-0 flex-col overflow-hidden">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center justify-between px-6 py-3 border-b border-gray-100/80"
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="rounded-lg p-2"
                style={{
                  background:
                    "linear-gradient(90deg, #ecc1b0,#ffebd2,#b1b5e2,#7387ce,#4869bf)",
                }}
              >
                <MessageSquare size={18} className="text-white" />
              </motion.div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Chats</div>
                <div className="text-xs text-gray-500 -mt-1">Conversations</div>
              </div>
            </div>
          </motion.div>

          {/* Content Area with Stagger Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex-1 overflow-y-auto px-4 py-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              {children}
            </motion.div>
          </motion.div>

          {/* Enhanced Bottom Action */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="border-t border-gray-100/80 p-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 text-center backdrop-blur-sm"
            >
              <p className="text-sm text-gray-600 mb-2">Quick Actions</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>Press</span>
                <kbd className="rounded-md bg-white px-2 py-1 text-xs font-medium text-gray-800 shadow-sm border border-gray-200">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>

      {/* Enhanced Menu Toggle Button - Only show on mobile */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{
          scale: isOpen ? 0 : 1,
          opacity: isOpen ? 0 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        onClick={toggle}
        className={`fixed top-5 left-5 z-40 rounded-xl bg-white p-3 shadow-lg border border-gray-200/80 backdrop-blur-xl md:hidden ${
          isOpen
            ? "pointer-events-none"
            : "pointer-events-auto hover:shadow-xl hover:scale-105"
        } transition-all duration-300`}
        aria-label="Toggle navigation"
      >
        <PanelLeftClose size={20} className="text-gray-700" />
      </motion.button>

      {/* Enhanced Overlay Background - Only show on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-md md:hidden"
            onClick={toggle}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarComponent;
