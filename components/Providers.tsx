"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { useToolStore } from "@/stores/toolStore";
import { useModelStore } from "@/stores/modelStore";
import { SessionProvider, useSession } from "next-auth/react";

function ToolPreloader() {
  const { status } = useSession();
  const loadToolMetadata = useToolStore((state) => state.loadToolMetadata);
  const mcpConfigs = useModelStore((state) => state.mcpConfigs);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // 只在用户登录后且未加载过时，预加载工具元数据
    if (status === "authenticated" && !hasLoaded) {
      console.log("🚀 用户已登录，预加载工具元数据...");
      loadToolMetadata(mcpConfigs.length > 0 ? mcpConfigs : undefined)
        .then(() => {
          setHasLoaded(true);
          console.log("✅ 工具元数据预加载完成");
        })
        .catch((error) => {
          console.error("⚠️  预加载工具失败:", error);
        });
    }
  }, [status, hasLoaded, loadToolMetadata, mcpConfigs]);

  return null;
}

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

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CodeThemeProvider>
          <ThreadProvider>
            <ToolPreloader />
            {children}
          </ThreadProvider>
        </CodeThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
