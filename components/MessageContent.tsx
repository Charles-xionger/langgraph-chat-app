"use client";

import { MessageResponse } from "@/types/message";
import {
  Copy,
  Check,
  FileText,
  Music,
  Video,
  Download,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  dracula,
  oneDark,
  vscDarkPlus,
  atomDark,
  nightOwl,
  tomorrow,
  prism,
  materialLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useCodeTheme } from "@/contexts/CodeThemeContext";

interface MessageContentProps {
  message: MessageResponse;
}

export const MessageContent = ({ message }: MessageContentProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const { theme } = useCodeTheme();

  // 检测系统主题
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // 监听系统主题变化
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // 暗色主题映射
  const darkThemeStyles = {
    dracula: { style: dracula, bg: "#282a36", headerBg: "#1e1f29" },
    "one-dark": { style: oneDark, bg: "#282c34", headerBg: "#21252b" },
    "vs-dark": { style: vscDarkPlus, bg: "#1e1e1e", headerBg: "#2d2d30" },
    "atom-dark": { style: atomDark, bg: "#161719", headerBg: "#1d1f21" },
    "night-owl": { style: nightOwl, bg: "#011627", headerBg: "#01111d" },
  };

  // 亮色主题映射
  const lightThemeStyles = {
    tomorrow: { style: tomorrow, bg: "#ffffff", headerBg: "#f8f8f8" },
    prism: { style: prism, bg: "#ffffff", headerBg: "#f5f5f5" },
    "material-light": {
      style: materialLight,
      bg: "#fafafa",
      headerBg: "#f0f0f0",
    },
  };

  // 获取当前主题样式
  const getCurrentTheme = () => {
    if (isDark) {
      return (
        darkThemeStyles[theme as keyof typeof darkThemeStyles] ||
        darkThemeStyles.dracula
      );
    } else {
      return (
        lightThemeStyles[theme as keyof typeof lightThemeStyles] ||
        lightThemeStyles.prism
      );
    }
  };

  const currentTheme = getCurrentTheme();

  // 复制代码功能
  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(codeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // 获取文件类型图标
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
      case "doc":
      case "docx":
      case "txt":
      case "md":
        return <FileText className="w-5 h-5" />;
      case "mp3":
      case "wav":
      case "aac":
      case "flac":
        return <Music className="w-5 h-5" />;
      case "mp4":
      case "avi":
      case "mkv":
      case "mov":
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // 获取文件类型标签
  const getFileTypeLabel = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "PDF 文档";
      case "doc":
      case "docx":
        return "Word 文档";
      case "txt":
        return "文本文件";
      case "md":
        return "Markdown 文档";
      case "mp3":
      case "wav":
      case "aac":
      case "flac":
        return "音频文件";
      case "mp4":
      case "avi":
      case "mkv":
      case "mov":
        return "视频文件";
      default:
        return "文档";
    }
  };

  // 解析文件信息
  const parseFileInfo = (text: string) => {
    // 匹配格式：文件: filename.ext (123KB 文档文件)
    const match = text.match(/文件:\s*(.+?)\s*\((\d+)KB\s+(.+?)\)/);
    if (match) {
      const [, fileName, sizeKB, fileType] = match;
      return { fileName, sizeKB: parseInt(sizeKB), fileType };
    }
    return null;
  };

  // 渲染文件卡片
  const renderFileCard = (
    fileName: string,
    sizeKB: number,
    fileType: string
  ) => {
    const icon = getFileIcon(fileName);
    const typeLabel = getFileTypeLabel(fileName);

    return (
      <div className="border-2 border-[#C78F56]/30 rounded-lg p-4 bg-gradient-to-br from-[#F2E6C2]/20 to-[#F2E6C2]/10 hover:from-[#F2E6C2]/30 hover:to-[#F2E6C2]/20 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-[#C78F56]/20 text-[#451806] dark:text-[#F2E6C2]">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#451806] dark:text-[#F2E6C2] truncate">
              {fileName}
            </p>
            <p className="text-sm text-[#8B4513]/70 dark:text-[#F2E6C2]/70">
              {typeLabel} • {sizeKB}KB
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              className="p-2 rounded-lg bg-[#C78F56]/20 hover:bg-[#C78F56]/30 text-[#451806] dark:text-[#F2E6C2] transition-colors"
              title="下载文件（功能待实现）"
              onClick={() => alert("下载功能待实现")}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-lg bg-[#C78F56]/20 hover:bg-[#C78F56]/30 text-[#451806] dark:text-[#F2E6C2] transition-colors"
              title="在新窗口打开（功能待实现）"
              onClick={() => alert("预览功能待实现")}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 创建 ReactMarkdown 组件配置
  const createMarkdownComponents = () => ({
    code: (props: any) => {
      const { className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1].toLowerCase() : "";
      const code = String(children).replace(/\n$/, "");

      // 判断是否为行内代码：没有语言标识且不包含换行符
      if (!match && !code.includes("\n")) {
        return (
          <code
            {...rest}
            className="px-1.5 py-0.5 rounded text-sm bg-[#F2E6C2]/80 dark:bg-[#2a2a2a] text-[#451806] dark:text-[#F2E6C2] border border-[#C78F56]/30"
          >
            {children}
          </code>
        );
      }

      const codeId = `${language}-${Math.random().toString(36).substr(2, 9)}`;

      return (
        <div
          className="my-4 rounded-lg overflow-hidden border-2 border-[#C78F56]/30"
          style={{ backgroundColor: currentTheme.bg }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: currentTheme.headerBg }}
          >
            <span className="text-[#451806] dark:text-[#F2E6C2]">
              {language || "code"}
            </span>
            <button
              onClick={() => copyToClipboard(code, codeId)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#C78F56]/20 transition-colors text-[#451806] dark:text-[#F2E6C2]"
            >
              {copiedCode === codeId ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="text-xs">
                {copiedCode === codeId ? "Copied!" : "Copy"}
              </span>
            </button>
          </div>
          <SyntaxHighlighter
            style={currentTheme.style}
            language={language || "text"}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: "1.5",
              background: "transparent",
            }}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    },
  });

  // 处理不同类型的 content
  const renderContent = () => {
    const messageData = message.data;

    // 处理interrupt类型消息
    if (message.type === "interrupt") {
      return (
        <div className="text-gray-600 dark:text-gray-400">
          Interrupt: {JSON.stringify(messageData, null, 2)}
        </div>
      );
    }

    // 对于其他消息类型，获取content
    const content = "content" in messageData ? messageData.content : null;

    if (!content) {
      return (
        <div className="text-gray-500 dark:text-gray-400">
          No content available
        </div>
      );
    }

    // 如果content是字符串，直接渲染markdown
    if (typeof content === "string") {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={createMarkdownComponents()}
        >
          {content}
        </ReactMarkdown>
      );
    }

    // 如果content是数组（多模态内容），分别处理每个元素
    if (Array.isArray(content)) {
      return (
        <div className="space-y-3">
          {content.map((item, index) => {
            // 处理文本内容
            if (typeof item === "object" && item && "type" in item) {
              if (item.type === "text" && "text" in item) {
                const textContent = (item.text as string) || "";
                // 检查是否包含文件信息
                const fileInfo = parseFileInfo(textContent);

                if (fileInfo) {
                  // 如果是文件信息，渲染文件卡片
                  const remainingText = textContent
                    .replace(/文件:\s*.+?\s*\(\d+KB\s+.+?\)/, "")
                    .trim();
                  return (
                    <div key={index} className="space-y-3">
                      {remainingText && (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={createMarkdownComponents()}
                        >
                          {remainingText}
                        </ReactMarkdown>
                      )}
                      {renderFileCard(
                        fileInfo.fileName,
                        fileInfo.sizeKB,
                        fileInfo.fileType
                      )}
                    </div>
                  );
                } else {
                  // 普通文本内容
                  return (
                    <div key={index}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={createMarkdownComponents()}
                      >
                        {textContent}
                      </ReactMarkdown>
                    </div>
                  );
                }
              }

              // 处理图片内容
              if (
                item.type === "image_url" &&
                "image_url" in item &&
                item.image_url &&
                typeof item.image_url === "object" &&
                "url" in item.image_url
              ) {
                return (
                  <div key={index} className="my-3">
                    <img
                      src={item.image_url.url as string}
                      alt="Uploaded image"
                      className="max-w-full h-auto rounded-lg border-2 border-[#C78F56]/30 shadow-sm"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                );
              }

              // 对于其他类型的内容，显示为JSON
              return (
                <div key={index} className="my-2">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              );
            }

            // 处理纯字符串内容项
            if (typeof item === "string") {
              return (
                <div key={index}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={createMarkdownComponents()}
                  >
                    {item}
                  </ReactMarkdown>
                </div>
              );
            }

            // 对于其他类型，显示为JSON
            return (
              <div key={index} className="my-2">
                <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      );
    }

    // 对于其他类型的content，显示为JSON
    return (
      <pre className="text-sm text-gray-600 dark:text-gray-400">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {renderContent()}
    </div>
  );
};

export default MessageContent;
