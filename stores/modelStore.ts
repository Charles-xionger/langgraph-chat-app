import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHATBOT_MODELS } from "@/lib/constants";

interface ModelState {
  selectedModel: string;
  selectedProvider: string | null;
  selectedModelId: string | undefined;
  autoToolCall: boolean; // 是否自动执行工具调用（不需要人工确认）
  enabledTools: string[]; // 启用的工具列表
  setModel: (
    modelName: string,
    provider: string | null,
    modelId?: string,
  ) => void;
  setAutoToolCall: (auto: boolean) => void;
  setEnabledTools: (tools: string[]) => void;
}

const defaultModel = CHATBOT_MODELS[0];

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: defaultModel.name,
      selectedProvider: defaultModel.provider,
      selectedModelId: defaultModel.model,
      autoToolCall: false, // 默认需要人工确认
      enabledTools: ["internal:get_weather", "internal:calculator"], // 默认启用基础工具
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
    }),
    {
      name: "model-config", // localStorage key
    },
  ),
);
