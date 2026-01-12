import { MessageOptions, MessageResponse, Thread } from "@/types/message";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/agent";

// 获取 thread 列表
export async function getThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_BASE_URL}/threads`);

  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }
  return response.json();
}

// 创建一个新的线程
export async function createThread(): Promise<Thread> {
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to create thread");
  }
  return response.json();
}

// 更新线程标题
export async function updateThreadTitle(
  threadId: string,
  title: string
): Promise<Thread> {
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadId, title }),
  });

  if (!response.ok) {
    throw new Error("Failed to update thread title");
  }
  return response.json();
}

// 删除线程
export async function deleteThread(threadId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/threads`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadId }),
  });

  if (!response.ok) {
    throw new Error("Failed to delete thread");
  }
}

// 根据 threadId 获取 history messages
export async function getThreadMessages(
  threadId: string
): Promise<MessageResponse[]> {
  const response = await fetch(`${API_BASE_URL}/history/${threadId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch thread messages");
  }
  const data = await response.json();
  return data as MessageResponse[];
}

// 创建 message 流式响应
export async function createMessageStream(
  threadId: string,
  message: string,
  opts?: MessageOptions
) {
  // 如果有文件，使用 POST 请求
  if (opts?.files && opts.files.length > 0) {
    const response = await fetch(`${API_BASE_URL}/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId,
        content: message,
        provider: opts.provider,
        model: opts.model,
        allowTool: opts.allowTool,
        files: opts.files,
        mcpUrl: opts.mcpUrl,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create message stream");
    }

    // POST 请求直接返回 SSE 流
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    // 创建一个 EventSource 兼容的对象
    const eventSource = {
      onmessage: null as ((event: MessageEvent) => void) | null,
      addEventListener: (type: string, listener: (event: Event) => void) => {
        if (type === "message") {
          eventSource.onmessage = listener as (event: MessageEvent) => void;
        } else if (type === "done") {
          eventSource.ondone = listener;
        } else if (type === "error") {
          eventSource.onerror = listener;
        }
      },
      close: () => {
        if (!done) {
          reader.cancel();
        }
      },
      ondone: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };

    let done = false;
    const decoder = new TextDecoder();

    // 处理流式响应
    (async () => {
      try {
        while (!done) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) {
            done = true;
            eventSource.ondone?.(new Event("done"));
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim() === "") continue;

              try {
                const messageEvent = new MessageEvent("message", { data });
                eventSource.onmessage?.(messageEvent);
              } catch (e) {
                // 忽略解析错误
              }
            } else if (line.startsWith("event: done")) {
              done = true;
              eventSource.ondone?.(new Event("done"));
              break;
            } else if (line.startsWith("event: error")) {
              eventSource.onerror?.(new Event("error"));
              break;
            }
          }
        }
      } catch (error) {
        eventSource.onerror?.(
          new MessageEvent("error", {
            data: JSON.stringify({
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          })
        );
      }
    })();

    return eventSource as unknown as EventSource;
  }

  // 原有的 GET 请求逻辑（无文件时）
  const queryParams = new URLSearchParams({
    threadId,
    content: message,
  });

  // 添加可选的模型配置参数
  if (opts?.provider) {
    queryParams.append("provider", opts.provider);
  }
  if (opts?.model) {
    queryParams.append("model", opts.model);
  }
  // 添加 allowTool 参数用于恢复 interrupt 执行
  if (opts?.allowTool) {
    queryParams.append("allowTool", opts.allowTool);
  }
  // 添加 mcpUrl 参数
  if (opts?.mcpUrl) {
    queryParams.append("mcpUrl", opts.mcpUrl);
  }

  return new EventSource(`${API_BASE_URL}/stream?${queryParams.toString()}`);
}
