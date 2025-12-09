"use client";

import {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { flushSync } from "react-dom";
import { Send, Loader2, Plus, Mic, ChevronDown, MicOff } from "lucide-react";
import ComposerActionsPopover from "./ComposerActionsPopover";
import { cls } from "@/lib/utils";
import { CHATBOT_MODELS } from "@/lib/constants";
import { useQwenASR } from "@/hooks/useQwenASR";

interface ComposerProps {
  onSend?: (message: string) => void | Promise<void>;
  busy?: boolean;
  selectedModel?: string;
  onModelChange?: (
    model: string,
    provider: string | null,
    modelId?: string
  ) => void;
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
  const initialTextRef = useRef<string>(""); // 保存录音前的初始文本

  const currentModel =
    CHATBOT_MODELS.find((bot) => bot.name === selectedModel) ||
    CHATBOT_MODELS[0];

  // 语音识别 Hook
  const {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing,
    transcript,
    status: asrStatus,
  } = useQwenASR({
    onRealtimeTranscript: (confirmedText, pendingText) => {
      // 使用 flushSync 强制立即同步更新 DOM
      flushSync(() => {
        const initial = initialTextRef.current;
        // text 是累积的已确认文本，stash 是待确认文本
        // 每次直接显示：初始文本 + (text + stash)
        const voiceText = (confirmedText + pendingText).trim();
        if (initial && voiceText) {
          setValue(`${initial} ${voiceText}`);
        } else if (voiceText) {
          setValue(voiceText);
        } else if (initial) {
          setValue(initial);
        }
      });
    },
    onTranscript: (text) => {
      // 一句话完成，将其追加到 initialTextRef，这样下一句话会叠加
      const trimmedText = text.trim();
      if (trimmedText) {
        flushSync(() => {
          if (initialTextRef.current) {
            initialTextRef.current = `${initialTextRef.current} ${trimmedText}`;
          } else {
            initialTextRef.current = trimmedText;
          }
          // 更新输入框显示
          setValue(initialTextRef.current);
        });
      }
    },
    onError: (error) => {
      console.error("[ASR Error]", error);
      alert(`语音识别错误: ${error.message}`);
    },
  });

  // 处理语音按钮点击
  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      // 开始录音前，保存当前输入框的文本
      initialTextRef.current = value.trim();
      startRecording();
    }
  };

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

    // 如果正在录音，先停止
    if (isRecording) {
      stopRecording();
    }

    setSending(true);
    try {
      await onSend?.(value);
      setValue("");
      initialTextRef.current = "";
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
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#A05030]/60 dark:placeholder:text-[#8B7355]/60 transition-all duration-200 stardew-input",
              "px-0 py-2 min-h-10 text-left text-[#451806] dark:text-[#F2E6C2]",
              "font-[family-name:var(--font-sans)]"
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
                  {CHATBOT_MODELS.map((bot) => (
                    <button
                      key={bot.name}
                      onClick={() => {
                        onModelChange?.(bot.name, bot.provider, bot.model);
                        setIsModelDropdownOpen(false);
                      }}
                      className={cls(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs text-left rounded hover:bg-[#C78F56]/20",
                        bot.name === selectedModel && "bg-[#C78F56]/30",
                        !bot.provider && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!bot.provider}
                      title={!bot.provider ? "暂未配置" : ""}
                    >
                      <span className="text-sm">{bot.icon}</span>
                      {bot.name}
                      {!bot.provider && (
                        <span className="ml-auto text-[10px]">⏳</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleVoiceClick}
              disabled={isProcessing}
              className={cls(
                "inline-flex items-center justify-center rounded p-2 transition-colors",
                isRecording
                  ? "text-red-500 bg-red-500/20 hover:bg-red-500/30 animate-pulse"
                  : "text-[#A05030] dark:text-[#C78F56] hover:bg-[#C78F56]/20 hover:text-[#552814] dark:hover:text-[#F2E6C2]",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              title={
                isRecording
                  ? "停止录音"
                  : isProcessing
                  ? "处理中..."
                  : "语音输入"
              }
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
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
        {isRecording ? (
          <span className="text-red-500 dark:text-red-400 animate-pulse">
            🎙️ 正在录音... 点击麦克风停止
          </span>
        ) : isProcessing ? (
          <span className="text-[--stardew-purple]">⏳ 正在处理语音...</span>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
});

export default Composer;
