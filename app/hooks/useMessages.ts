import { useState, useEffect } from "react";

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
}

export function useMessages(threadId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 加载历史消息
  const loadHistory = async (tid: string) => {
    try {
      const res = await fetch(`/api/chat/history?thread_id=${tid}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("加载历史消息失败:", error);
    }
  };

  // 当 threadId 变化时，加载历史消息
  useEffect(() => {
    if (threadId) {
      loadHistory(threadId);
    } else {
      setMessages([]);
    }
  }, [threadId]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const assistantMessage: Message = {
        id: Date.now().toString() + "-ai",
        type: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "chunk" && data.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.type === "assistant") {
                  updated[updated.length - 1] = {
                    ...lastMsg,
                    content: lastMsg.content + data.content,
                  };
                }
                return updated;
              });
            } else if (data.type === "end") {
              // Stream ended
            } else if (data.type === "error") {
              // Error from server
            }
          } catch (e) {
            // Failed to parse JSON
          }
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          type: "assistant",
          content: "抱歉，发生错误了。请重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    loading,
    handleSendMessage,
  };
}
