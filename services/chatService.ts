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

  return new EventSource(`${API_BASE_URL}/stream?${queryParams.toString()}`);
}
