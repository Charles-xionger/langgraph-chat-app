"use client";
import { JSX, useState } from "react";
import {
  Paperclip,
  Bot,
  Search,
  Palette,
  BookOpen,
  MoreHorizontal,
  Globe,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ActionItem {
  icon: LucideIcon | (() => JSX.Element);
  label: string;
  color?: string;
  badge?: string;
  action: () => void;
}

interface ComposerActionsPopoverProps {
  children: React.ReactNode;
}

export default function ComposerActionsPopover({
  children,
}: ComposerActionsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const mainActions: ActionItem[] = [
    {
      icon: Paperclip,
      label: "Add photos & files",
      color: "text-[#A05030] dark:text-[#6B4423]",
      action: () => console.log("Add photos & files"),
    },
    {
      icon: Bot,
      label: "Junimo mode",
      color: "text-[#5DCC52]",
      badge: "NEW",
      action: () => console.log("Junimo mode"),
    },
    {
      icon: Search,
      label: "Deep research",
      color: "text-[#4A90D9]",
      action: () => console.log("Deep research"),
    },
    {
      icon: Palette,
      label: "Create image",
      color: "text-[#9A55FF]",
      action: () => console.log("Create image"),
    },
    {
      icon: BookOpen,
      label: "Study and learn",
      color: "text-[#FFD700]",
      action: () => console.log("Study and learn"),
    },
  ];

  const moreActions: ActionItem[] = [
    {
      icon: Globe,
      label: "Web search",
      color: "text-[#4A90D9]",
      action: () => console.log("Web search"),
    },
    {
      icon: Palette,
      label: "Canvas",
      color: "text-[#9A55FF]",
      action: () => console.log("Canvas"),
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-linear-to-br from-[#5DCC52] to-[#3da83d] flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect to Farm",
      action: () => console.log("Connect to Farm"),
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-linear-to-br from-[#4A90D9] to-[#3a70b9] flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect Pelican Town",
      action: () => console.log("Connect Pelican Town"),
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-linear-to-br from-[#9A55FF] to-[#7a35df] flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect Wizard Tower",
      action: () => console.log("Connect Wizard Tower"),
    },
  ];

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
    setShowMore(false);
  };

  const handleMoreClick = () => {
    setShowMore(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowMore(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 stardew-box rounded-lg border-none"
        align="start"
        side="top"
      >
        {!showMore ? (
          <div className="p-3">
            <div className="space-y-1">
              {mainActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]"
                  >
                    <IconComponent
                      className={`h-4 w-4 ${action.color || ""}`}
                    />
                    <span>{action.label}</span>
                    {action.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs bg-[#5DCC52]/20 text-[#5DCC52] border border-[#5DCC52]/50 rounded-full font-bold">
                        {action.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleMoreClick}
                className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded inventory-slot text-[#451806] dark:text-[#2C1810]"
              >
                <MoreHorizontal className="h-4 w-4 text-[#A05030] dark:text-[#6B4423]" />
                <span>More</span>
                <ChevronRight className="h-4 w-4 ml-auto text-[#A05030] dark:text-[#6B4423]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex">
            <div className="flex-1 p-3 border-r-4 border-[#552814] dark:border-[#3d2f1f]">
              <div className="space-y-1">
                {mainActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAction(action.action)}
                      className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]"
                    >
                      <IconComponent
                        className={`h-4 w-4 ${action.color || ""}`}
                      />
                      <span>{action.label}</span>
                      {action.badge && (
                        <span className="ml-auto px-2 py-0.5 text-xs bg-[#5DCC52]/20 text-[#5DCC52] border border-[#5DCC52]/50 rounded-full font-bold">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={handleMoreClick}
                  className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded inventory-slot text-[#451806] dark:text-[#2C1810]"
                >
                  <MoreHorizontal className="h-4 w-4 text-[#A05030] dark:text-[#6B4423]" />
                  <span>More</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-[#A05030] dark:text-[#6B4423]" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-3">
              <div className="space-y-1">
                {moreActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAction(action.action)}
                      className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-[#C78F56]/20 rounded text-[#451806] dark:text-[#2C1810]"
                    >
                      {typeof IconComponent === "function" &&
                      IconComponent.length === 0 ? (
                        <IconComponent />
                      ) : (
                        <IconComponent
                          className={`h-4 w-4 ${action.color || ""}`}
                        />
                      )}
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
