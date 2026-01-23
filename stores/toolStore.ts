import { create } from "zustand";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: "internal" | "mcp";
  schema?: any;
}

interface ToolState {
  internalTools: ToolMetadata[];
  mcpTools: ToolMetadata[];
  loading: boolean;
  error: string | null;
  mcpUrl: string | null;
  loadToolMetadata: (mcpUrl?: string) => Promise<void>;
  refreshTools: () => Promise<void>;
}

export const useToolStore = create<ToolState>((set, get) => ({
  internalTools: [],
  mcpTools: [],
  loading: false,
  error: null,
  mcpUrl: null,

  loadToolMetadata: async (mcpUrl?: string) => {
    set({ loading: true, error: null });

    try {
      const url = mcpUrl
        ? `/api/tools/metadata?mcpUrl=${encodeURIComponent(mcpUrl)}`
        : "/api/tools/metadata";

      console.log(`🔧 Loading tools metadata from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Tools metadata loaded:`, {
        internal: data.internal.length,
        mcp: data.mcp.length,
        mcpUrl: data.mcpUrl,
      });

      set({
        internalTools: data.internal || [],
        mcpTools: data.mcp || [],
        mcpUrl: data.mcpUrl,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("❌ Failed to load tools metadata:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      set({
        error: errorMessage,
        loading: false,
        // 降级：使用基础工具列表
        internalTools: [
          {
            id: "internal:get_weather",
            name: "get_weather",
            description: "Get weather information",
            category: "internal",
          },
          {
            id: "internal:calculator",
            name: "calculator",
            description: "Calculate mathematical expressions",
            category: "internal",
          },
        ],
        mcpTools: [],
      });
    }
  },

  refreshTools: async () => {
    const { mcpUrl } = get();
    await get().loadToolMetadata(mcpUrl || undefined);
  },
}));
