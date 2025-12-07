import React, { createContext, useContext, useState } from "react";

interface ThreadData {
  id: string;
  title?: string;
  updatedAt: string;
  messages?: any[];
}

interface ThreadContextType {
  activeThreadId: string | null;
  setActiveThreadId: (threadId: string | null) => void;
  currentThread: ThreadData | null;
  setCurrentThread: (thread: ThreadData | null) => void;
}

const ThreadContext = createContext<ThreadContextType | null>(null);

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [currentThread, setCurrentThread] = useState<ThreadData | null>(null);

  return (
    <ThreadContext.Provider
      value={{
        activeThreadId,
        setActiveThreadId,
        currentThread,
        setCurrentThread,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

export function useThreadContext() {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error("useThreadContext must be used within a ThreadProvider");
  }
  return context;
}
