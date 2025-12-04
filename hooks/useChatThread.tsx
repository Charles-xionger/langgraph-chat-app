import { MessageResponse } from "@/types/message";

export interface UseChatThreadOptions {
  messages: MessageResponse[];
}

export function useChatThread(threadId: string) {
  // Placeholder for chat thread logic
  return {
    threadId,
    messages: [],
  };
}
