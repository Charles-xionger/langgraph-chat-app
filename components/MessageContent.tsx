"use client";

import { MessageResponse } from "@/types/message";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  dracula,
  oneDark,
  vscDarkPlus,
  atomDark,
  nightOwl,
  tomorrow,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useCodeTheme } from "@/contexts/CodeThemeContext";

interface MessageContentProps {
  message: MessageResponse;
}

export const MessageContent = ({ message }: MessageContentProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { theme } = useCodeTheme();

  // 主题映射
  const themeStyles = {
    dracula: { style: dracula, bg: "#282a36", headerBg: "#1e1f29" },
    oneDark: { style: oneDark, bg: "#282c34", headerBg: "#21252b" },
    vscDarkPlus: { style: vscDarkPlus, bg: "#1e1e1e", headerBg: "#252526" },
    atomDark: { style: atomDark, bg: "#161719", headerBg: "#0d0e0f" },
    nightOwl: { style: nightOwl, bg: "#011627", headerBg: "#001424" },
    githubDark: { style: tomorrow, bg: "#0d1117", headerBg: "#161b22" },
  } as const;

  type ThemeKey = keyof typeof themeStyles;

  const currentTheme = themeStyles[theme as ThemeKey] || themeStyles.dracula;

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const content =
    typeof message.data.content === "string"
      ? message.data.content
      : JSON.stringify(message.data.content);

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: (props) => {
            const { className, children, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1].toLowerCase() : "";
            const code = String(children).replace(/\n$/, "");

            // 判断是否为行内代码：没有语言标识且不包含换行符
            const isInline = !className && !code.includes("\n");

            const codeId = `${message.data.id}-${language}-${code.substring(
              0,
              20
            )}`;

            // 语言别名映射
            const languageMap: Record<string, string> = {
              js: "javascript",
              ts: "typescript",
              py: "python",
              rb: "ruby",
              sh: "bash",
              yml: "yaml",
            };

            const normalizedLanguage = languageMap[language] || language;

            // 行内代码样式
            if (isInline) {
              return (
                <code
                  className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400 before:content-[''] after:content-['']"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            // 代码块样式
            return (
              <div
                className="my-4 rounded-lg border border-border overflow-hidden"
                style={{ backgroundColor: currentTheme.bg }}
              >
                <div
                  className="flex items-center justify-between border-b border-border px-4 py-2"
                  style={{ backgroundColor: currentTheme.headerBg }}
                >
                  <span className="text-xs font-mono text-gray-300 uppercase">
                    {language || "code"}
                  </span>
                  <button
                    onClick={() => copyToClipboard(code, codeId)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === codeId ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  language={normalizedLanguage || "text"}
                  style={currentTheme.style}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: currentTheme.bg,
                    fontSize: "0.875rem",
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    },
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          },
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 space-y-1.5 list-decimal pl-5 [&>li]:pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          p: ({ children }) => (
            <p className="my-3 leading-7 first:mt-0 last:mb-0">{children}</p>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-current opacity-80 underline underline-offset-4 hover:opacity-100 contrast-more:text-current"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-border bg-muted px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-4 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
