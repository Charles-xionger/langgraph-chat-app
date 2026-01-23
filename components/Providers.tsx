"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { useToolStore } from "@/stores/toolStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      }),
  );

  const loadToolMetadata = useToolStore((state) => state.loadToolMetadata);

  // 预加载工具元数据
  useEffect(() => {
    console.log("🚀 Preloading tools metadata...");
    loadToolMetadata().catch((error) => {
      console.error("⚠️  Failed to preload tools:", error);
    });
  }, [loadToolMetadata]);

  return (
    <QueryClientProvider client={queryClient}>
      <CodeThemeProvider>
        <ThreadProvider>{children}</ThreadProvider>
      </CodeThemeProvider>
    </QueryClientProvider>
  );
}
