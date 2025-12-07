"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ThreadProvider } from "@/contexts/ThreadContext";
import { CodeThemeProvider } from "@/contexts/CodeThemeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CodeThemeProvider>
          <ThreadProvider>{children}</ThreadProvider>
        </CodeThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
