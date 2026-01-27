import { createMessageStream } from "@/services/chatService";
import {
  MessageOptions,
  MessageResponse,
  AttachmentFile,
  MultiModalContent,
} from "@/types/message";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export function useStreamedMessages(
  threadId?: string,
  currentConfig?: {
    provider?: string;
    model?: string;
    autoToolCall?: boolean;
    enabledTools?: string[];
    mcpConfigs?: Array<{
      id: string;
      url: string;
      headers?: Record<string, string>;
    }>;
  },
) {
  const queryClient = useQueryClient();

  const streamRef = useRef<EventSource | null>(null);
  const currentMessageRef = useRef<MessageResponse | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [sendError, setSendError] = useState<Error | null>(null);

  // 监听配置变化
  useEffect(() => {
    console.log("📡 useStreamedMessages: config changed:", currentConfig);
  }, [currentConfig]);

  const cleanupStream = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.close();
      }
    } catch {
      // ignore
    } finally {
      streamRef.current = null;
      currentMessageRef.current = null;
      setIsSending(false);
      setIsReceiving(false);
    }
  }, []);

  const handleStreamResponse = useCallback(
    async (streamParams: {
      threadId: string;
      text?: string;
      opts?: MessageOptions;
    }) => {
      const { threadId: tid, text = "", opts } = streamParams;

      setIsSending(true);
      setIsReceiving(false);
      setSendError(null);

      // close previous stream if present
      if (streamRef.current) {
        try {
          streamRef.current.close();
        } catch {}
        streamRef.current = null;
      }

      try {
        const stream = await createMessageStream(tid, text, opts);

        streamRef.current = stream;

        stream.onmessage = (event: MessageEvent) => {
          try {
            const messageResponse = JSON.parse(event.data) as MessageResponse;
            console.log(
              "📨 Received message:",
              messageResponse.type,
              messageResponse,
            );

            const data: any = messageResponse.data;

            // 一旦收到第一个消息，标记为正在接收
            setIsReceiving(true);

            // 中断消息 (type: "interrupt") 直接追加，用于显示审批 UI
            if (messageResponse.type === "interrupt") {
              queryClient.setQueryData(
                ["messages", tid],
                (old: MessageResponse[] = []) => [...old, messageResponse],
              );
              return;
            }

            // 工具执行结果消息 (type: "tool") 直接追加，不累积
            if (messageResponse.type === "tool") {
              queryClient.setQueryData(
                ["messages", tid],
                (old: MessageResponse[] = []) => [...old, messageResponse],
              );
              return;
            }

            // AI 消息带有 tool_calls 且无文本内容，表示工具调用请求
            // 这种情况下，我们需要更新现有消息或新增
            const hasToolCalls = data.tool_calls && data.tool_calls.length > 0;
            const hasContentArray =
              Array.isArray(data.content) && data.content.length > 0;
            const hasContentString =
              typeof data.content === "string" && data.content.trim();

            console.log("📨 Processing AI message:", {
              id: data.id,
              hasToolCalls,
              hasContentArray,
              hasContentString,
              contentType: Array.isArray(data.content)
                ? "array"
                : typeof data.content,
              isNewMessage:
                !currentMessageRef.current ||
                currentMessageRef.current.data.id !== data.id,
            });

            if (
              !currentMessageRef.current ||
              currentMessageRef.current.data.id !== data.id
            ) {
              // 新消息
              console.log("➕ Adding new AI message to state");
              currentMessageRef.current = messageResponse;
              queryClient.setQueryData(
                ["messages", tid],
                (old: MessageResponse[] = []) => [
                  ...old,
                  currentMessageRef.current!,
                ],
              );
            } else {
              // 累积现有消息
              console.log("🔄 Updating existing AI message");
              const currentData: any = currentMessageRef.current.data;

              // 文本内容累积
              let newContent = currentData.content || "";
              if (data.content) {
                // 如果新内容是字符串，累积到现有内容
                if (typeof data.content === "string") {
                  newContent =
                    typeof currentData.content === "string"
                      ? currentData.content + data.content
                      : data.content;
                }
                // 如果新内容是数组（如 functionCall），直接替换
                else if (Array.isArray(data.content)) {
                  console.log(
                    "🔧 Received array content (functionCall):",
                    data.content,
                  );
                  newContent = data.content;
                }
              }

              // 工具调用：直接替换（后端会发送完整的 tool_calls）
              const newToolCalls = hasToolCalls
                ? data.tool_calls
                : currentData.tool_calls;

              currentMessageRef.current = {
                ...currentMessageRef.current,
                data: {
                  ...currentData,
                  content: newContent,
                  ...(newToolCalls && { tool_calls: newToolCalls }),
                  ...(data.additional_kwargs && {
                    additional_kwargs: data.additional_kwargs,
                  }),
                  ...(data.response_metadata && {
                    response_metadata: data.response_metadata,
                  }),
                },
              };

              console.log("💾 Updated message:", {
                id: currentMessageRef.current.data.id,
                contentType: Array.isArray(newContent)
                  ? "array"
                  : typeof newContent,
                hasToolCalls: !!newToolCalls,
              });

              queryClient.setQueryData(
                ["messages", tid],
                (old: MessageResponse[] = []) => {
                  const idx = old.findIndex(
                    (m) => m.data?.id === currentMessageRef.current!.data.id,
                  );
                  if (idx === -1) return old;
                  const clone = [...old];
                  clone[idx] = currentMessageRef.current!;
                  return clone;
                },
              );
            }
          } catch {
            // ignore malformed chunk
          }
        };

        stream.addEventListener("done", () => {
          setIsSending(false);
          setIsReceiving(false);
          currentMessageRef.current = null;

          // 刷新线程列表，以获取可能更新的标题
          queryClient.invalidateQueries({ queryKey: ["threads"] });

          try {
            stream.close();
          } catch {}
          streamRef.current = null;
        });

        stream.addEventListener("error", (ev: Event) => {
          try {
            const dataText = (ev as MessageEvent<string>)?.data;
            const message = (() => {
              try {
                const parsed = dataText ? JSON.parse(dataText) : null;
                return (
                  parsed?.message ||
                  "An error occurred while generating a response."
                );
              } catch {
                return "An error occurred while generating a response.";
              }
            })();

            const errorMsg: MessageResponse = {
              type: "error",
              data: { id: `err-${Date.now()}`, content: `⚠️ ${message}` },
            };

            queryClient.setQueryData(
              ["messages", tid],
              (old: MessageResponse[] = []) => [...old, errorMsg],
            );
          } finally {
            setIsSending(false);
            setIsReceiving(false);
            currentMessageRef.current = null;
            try {
              stream.close();
            } catch {}
            streamRef.current = null;
          }
        });
      } catch (err: unknown) {
        setSendError(err as Error);
        setIsSending(false);
        setIsReceiving(false);
        currentMessageRef.current = null;
        if (streamRef.current) {
          try {
            streamRef.current.close();
          } catch {}
          streamRef.current = null;
        }
      }
    },
    [queryClient],
  );

  const sendMessage = useCallback(
    async (text: string, files?: AttachmentFile[], opts?: MessageOptions) => {
      if (!threadId) return;

      const tempId = `temp-${Date.now()}`;

      // 构建多模态内容
      let content: string | MultiModalContent[] = text;
      if (files && files.length > 0) {
        const multiModalContent: MultiModalContent[] = [
          {
            type: "text",
            text: text,
          },
        ];

        // 添加图片内容
        files.forEach((file) => {
          if (file.type === "image") {
            multiModalContent.push({
              type: "image_url",
              image_url: {
                url: file.url || `data:image/png;base64,${file.data}`,
              },
            });
          }
        });

        content = multiModalContent;
      }

      const userMessage: MessageResponse = {
        type: "human",
        data: { id: tempId, content },
      };
      queryClient.setQueryData(
        ["messages", threadId],
        (old: MessageResponse[] = []) => [...old, userMessage],
      );

      // 合并文件选项、autoToolCall、enabledTools 和 mcpConfigs 配置
      const messageOptions: MessageOptions = {
        ...opts,
        ...(files && files.length > 0 && { files }),
        ...(currentConfig?.mcpConfigs &&
          currentConfig.mcpConfigs.length > 0 && {
            mcpConfigs: currentConfig.mcpConfigs,
          }),
        ...(currentConfig?.autoToolCall !== undefined && {
          autoToolCall: currentConfig.autoToolCall,
        }),
        ...(currentConfig?.enabledTools &&
          currentConfig.enabledTools.length > 0 && {
            enabledTools: currentConfig.enabledTools,
          }),
      };

      console.log("📤 Sending message with options:", messageOptions);
      console.log("🔧 Enabled tools:", messageOptions.enabledTools);
      console.log("🔗 MCP configs:", messageOptions.mcpConfigs || "(not set)");

      await handleStreamResponse({
        threadId,
        text,
        opts: messageOptions,
      });
    },
    [threadId, queryClient, handleStreamResponse, currentConfig],
  );

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const cancel = useCallback(() => {
    cleanupStream();
  }, [cleanupStream]);

  // 恢复 interrupt 执行的函数
  const resumeExecution = useCallback(
    async (allowTool: "allow" | "deny") => {
      if (!threadId) return;

      console.log("🔄 Resuming execution with:", { threadId, allowTool });

      // 先移除 interrupt 消息，避免重复显示
      queryClient.setQueryData(
        ["messages", threadId],
        (old: MessageResponse[] = []) =>
          old.filter((msg) => msg.type !== "interrupt"),
      );

      // 重置 currentMessageRef，确保新的 AI 响应能正确处理
      currentMessageRef.current = null;

      // 使用 GET 接口并传递 allowTool 参数来恢复执行
      await handleStreamResponse({
        threadId,
        text: "", // 空字符串，因为这是恢复操作，不是新消息
        opts: {
          allowTool,
          ...(currentConfig?.mcpConfigs &&
            currentConfig.mcpConfigs.length > 0 && {
              mcpConfigs: currentConfig.mcpConfigs,
            }),
          ...(currentConfig?.enabledTools &&
            currentConfig.enabledTools.length > 0 && {
              enabledTools: currentConfig.enabledTools,
            }),
          provider: currentConfig?.provider,
          model: currentConfig?.model,
        },
      });
    },
    [threadId, handleStreamResponse, queryClient, currentConfig],
  );

  return {
    sendMessage,
    handleStreamResponse,
    cancel,
    resumeExecution,
    isSending,
    isReceiving,
    sendError,
    streamRef,
  };
}
