import { create } from "zustand";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: "internal" | "mcp";
  schema?: any;
}

interface MCPConfigInfo {
  url: string;
  headers?: Record<string, string>;
}

interface ToolState {
  internalTools: ToolMetadata[];
  mcpTools: ToolMetadata[];
  loading: boolean;
  error: string | null;
  mcpConfigs: MCPConfigInfo[];
  loadToolMetadata: (mcpConfigs?: MCPConfigInfo[] | string) => Promise<void>;
  refreshTools: () => Promise<void>;
}

export const useToolStore = create<ToolState>((set, get) => ({
  internalTools: [],
  mcpTools: [],
  loading: false,
  error: null,
  mcpConfigs: [],

  loadToolMetadata: async (mcpConfigs?: MCPConfigInfo[] | string) => {
    set({ loading: true, error: null });

    try {
      let url = "/api/tools/metadata";

      // 兼容旧的 mcpUrl 字符串参数
      if (typeof mcpConfigs === "string") {
        url = `/api/tools/metadata?mcpUrl=${encodeURIComponent(mcpConfigs)}`;
      } else if (mcpConfigs && mcpConfigs.length > 0) {
        url = `/api/tools/metadata?mcpConfigs=${encodeURIComponent(JSON.stringify(mcpConfigs))}`;
      }

      console.log(`🔧 Loading tools metadata from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      console.log(`✅ Tools metadata loaded:`, {
        internal: data.internal.length,
        mcp: data.mcp.length,
        mcpConfigs: data.mcpConfigs?.length || 0,
      });

      set({
        internalTools: data.internal || [],
        mcpTools: data.mcp || [],
        mcpConfigs: data.mcpConfigs || [],
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
    const { mcpConfigs } = get();
    await get().loadToolMetadata(
      mcpConfigs.length > 0 ? mcpConfigs : undefined,
    );
  },
}));
