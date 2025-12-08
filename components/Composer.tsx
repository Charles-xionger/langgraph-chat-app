"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Send, Loader2, Plus, Mic, ChevronDown } from "lucide-react";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cls } from "@/lib/utils";

interface ComposerProps {
  onSend?: (message: string) => void | Promise<void>;
  busy?: boolean;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
}

export interface ComposerRef {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
}

const Composer = forwardRef<ComposerRef, ComposerProps>(function Composer(
  { onSend, busy, selectedModel, onModelChange },
  ref
) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stardew themed model names
  const chatbots = [
    { name: "GPT-5", icon: "🌟" },
    { name: "Claude Sonnet 4", icon: "🎵" },
    { name: "Gemini", icon: "💎" },
    { name: "Junimo", icon: "🍃" },
  ];

  const currentModel =
    chatbots.find((bot) => bot.name === selectedModel) || chatbots[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModelDropdownOpen]);

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      const lineHeight = 20;
      const minHeight = 40;

      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const calculatedLines = Math.max(
        1,
        Math.floor((scrollHeight - 16) / lineHeight)
      );

      setLineCount(calculatedLines);

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
        textarea.style.overflowY = "hidden";
      } else {
        textarea.style.height = `${minHeight + 11 * lineHeight}px`;
        textarea.style.overflowY = "auto";
      }
    }
  }, [value]);

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        setValue((prev) => {
          const newValue = prev
            ? `${prev}\n\n${templateContent}`
            : templateContent;
          setTimeout(() => {
            inputRef.current?.focus();
            const length = newValue.length;
            inputRef.current?.setSelectionRange(length, length);
          }, 0);
          return newValue;
        });
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }),
    []
  );

  async function handleSend() {
    if (!value.trim() || sending) return;
    setSending(true);
    try {
      await onSend?.(value);
      setValue("");
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t-4 border-[#552814] dark:border-[#3d2f1f] p-4 bg-[#F2E6C2] dark:bg-[#1a1f2e]">
      <div className="mx-auto flex flex-col inventory-slot rounded-lg p-3 max-w-3xl">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="What would you like to do today?"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#A05030]/60 dark:placeholder:text-[#8B7355]/60 transition-all duration-200",
              "px-0 py-2 min-h-10 text-left text-[#451806] dark:text-[#F2E6C2]"
            )}
            style={{
              height: "auto",
              overflowY: lineCount > 12 ? "auto" : "hidden",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <ComposerActionsPopover>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded p-2 text-[#A05030] dark:text-[#C78F56] hover:bg-[#C78F56]/20 hover:text-[#552814] dark:hover:text-[#F2E6C2] transition-colors"
                title="Add attachment"
              >
                <Plus className="h-4 w-4" />
              </button>
            </ComposerActionsPopover>

            {/* Model selector */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="inline-flex items-center gap-1.5 inventory-slot rounded px-2.5 py-1.5 text-xs font-medium text-[#451806] dark:text-[#F2E6C2] hover:bg-[#C78F56]/20 transition-colors"
              >
                <span className="text-xs">{currentModel.icon}</span>
                <span className="hidden sm:inline">{currentModel.name}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-44 stardew-box rounded p-1 z-50">
                  {chatbots.map((bot) => (
                    <button
                      key={bot.name}
                      onClick={() => {
                        onModelChange?.(bot.name);
                        setIsModelDropdownOpen(false);
                      }}
                      className={cls(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded hover:bg-[#C78F56]/20",
                        bot.name === selectedModel && "bg-[#C78F56]/30"
                      )}
                    >
                      <span className="text-sm">{bot.icon}</span>
                      {bot.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="inline-flex items-center justify-center rounded p-2 text-[#A05030] dark:text-[#C78F56] hover:bg-[#C78F56]/20 hover:text-[#552814] dark:hover:text-[#F2E6C2] transition-colors"
              title="Voice input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={sending || busy || !value.trim()}
              className={cls(
                "inline-flex shrink-0 items-center gap-2 stardew-btn rounded px-4 py-2 text-sm font-bold",
                (sending || busy || !value.trim()) &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              {sending || busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-[#A05030] dark:text-[#8B7355]">
        Press{" "}
        <kbd className="inventory-slot rounded px-1.5 py-0.5 text-[10px]">
          Enter
        </kbd>{" "}
        to send ·{" "}
        <kbd className="inventory-slot rounded px-1.5 py-0.5 text-[10px]">
          Shift
        </kbd>
        +
        <kbd className="inventory-slot rounded px-1.5 py-0.5 text-[10px]">
          Enter
        </kbd>{" "}
        for newline
      </div>
    </div>
  );
});

export default Composer;
