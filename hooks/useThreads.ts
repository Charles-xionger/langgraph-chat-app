"use client";

import {
  createThread,
  deleteThread,
  getThreads,
  updateThreadTitle,
  getThreadMessages,
} from "@/services/chatService";
import { MessageResponse, Thread } from "@/types/message";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// 获取线程列表的自定义 Hook
export function useGetThreads() {
  return useQuery<Thread[], Error>({
    queryKey: ["threads"],
    queryFn: () => getThreads(),
  });
}

// 创建线程的自定义 Hook
export function useCreateThread(onSuccess?: (thread: Thread) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createThread(),
    onSuccess: (newThread) => {
      // 在创建成功后，调用传入的回调函数
      if (onSuccess) {
        onSuccess(newThread);
      }
      // 使线程列表数据失效，以便重新获取最新的线程列表
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

// 更新线程标题的自定义 Hook
export function useUpdateThreadTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, title }: { threadId: string; title: string }) =>
      updateThreadTitle(threadId, title),
    onSuccess: () => {
      // 使线程列表数据失效，以便重新获取最新的线程列表
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

// 删除线程的自定义 Hook
export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => deleteThread(threadId),
    onSuccess: () => {
      // 使线程列表数据失效，以便重新获取最新的线程列表
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
}

// 获取 threadId 对应的 history messages
export function useHistoryMessages(threadId: string | undefined) {
  return useQuery<MessageResponse[], Error>({
    queryKey: ["messages", threadId],
    queryFn: () =>
      threadId ? getThreadMessages(threadId) : Promise.resolve([]),
    enabled: !!threadId, // 仅当 threadId 存在时才执行查询
  });
}
