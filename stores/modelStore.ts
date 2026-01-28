import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHATBOT_MODELS } from "@/lib/constants";

interface MCPConfigInfo {
  id: string;
  url: string;
  headers?: Record<string, string>;
}

interface ModelState {
  selectedModel: string;
  selectedProvider: string | null;
  selectedModelId: string | undefined;
  autoToolCall: boolean; // 是否自动执行工具调用（不需要人工确认）
  enabledTools: string[]; // 启用的工具列表
  mcpConfigs: MCPConfigInfo[]; // 多个 MCP 配置
  setModel: (
    modelName: string,
    provider: string | null,
    modelId?: string,
  ) => void;
  setAutoToolCall: (auto: boolean) => void;
  setEnabledTools: (tools: string[]) => void;
  setMcpConfigs: (configs: MCPConfigInfo[]) => void;
  addMcpConfig: (config: MCPConfigInfo) => void;
  removeMcpConfig: (id: string) => void;
  updateMcpConfig: (id: string, config: Partial<MCPConfigInfo>) => void;
}

const defaultModel = CHATBOT_MODELS[0];

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: defaultModel.name,
      selectedProvider: defaultModel.provider,
      selectedModelId: defaultModel.model,
      autoToolCall: true, // 默认自动执行工具调用
      enabledTools: ["internal:get_weather", "internal:calculator"], // 默认启用基础工具
      mcpConfigs: [],
      setModel: (modelName, provider, modelId) =>
        set({
          selectedModel: modelName,
          selectedProvider: provider,
          selectedModelId: modelId,
        }),
      setAutoToolCall: (auto) => {
        console.log("🏪 Store: setAutoToolCall called with:", auto);
        set({ autoToolCall: auto });
        console.log("🏪 Store: autoToolCall updated");
      },
      setEnabledTools: (tools) => {
        console.log("🔧 Store: setEnabledTools called with:", tools);
        set({ enabledTools: tools });
      },
      setMcpConfigs: (configs) => {
        console.log("🔌 Store: setMcpConfigs called with:", configs);
        set({ mcpConfigs: configs });
      },
      addMcpConfig: (config) => {
        set((state) => ({
          mcpConfigs: [
            ...state.mcpConfigs.filter((c) => c.id !== config.id),
            config,
          ],
        }));
      },
      removeMcpConfig: (id) => {
        set((state) => ({
          mcpConfigs: state.mcpConfigs.filter((c) => c.id !== id),
        }));
      },
      updateMcpConfig: (id, updatedConfig) => {
        set((state) => ({
          mcpConfigs: state.mcpConfigs.map((c) =>
            c.id === id ? { ...c, ...updatedConfig } : c,
          ),
        }));
      },
    }),
    {
      name: "model-config", // localStorage key
    },
  ),
);
