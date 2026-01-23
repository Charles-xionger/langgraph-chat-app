"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMessages } from "@/services/chatService";
import { useParams } from "next/navigation";

interface DeleteMessagesParams {
  messageIds: string[];
}

export function useDeleteMessages() {
  const queryClient = useQueryClient();
  const params = useParams();
  const threadId = params?.threadId as string;

  return useMutation({
    mutationFn: async ({ messageIds }: DeleteMessagesParams) => {
      if (!threadId) {
        throw new Error("Thread ID is required");
      }
      return deleteMessages(threadId, messageIds);
    },
    onSuccess: () => {
      // Invalidate messages query to refetch updated list
      if (threadId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", threadId],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to delete messages:", error);
    },
  });
}
