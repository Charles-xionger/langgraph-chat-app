import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHATBOT_MODELS } from "@/lib/constants";

interface ModelState {
  selectedModel: string;
  selectedProvider: string | null;
  selectedModelId: string | undefined;
  setModel: (
    modelName: string,
    provider: string | null,
    modelId?: string
  ) => void;
}

const defaultModel = CHATBOT_MODELS[0];

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: defaultModel.name,
      selectedProvider: defaultModel.provider,
      selectedModelId: defaultModel.model,
      setModel: (modelName, provider, modelId) =>
        set({
          selectedModel: modelName,
          selectedProvider: provider,
          selectedModelId: modelId,
        }),
    }),
    {
      name: "model-config", // localStorage key
    }
  )
);
