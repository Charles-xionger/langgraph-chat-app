/**
 * 共享常量 - 可以在客户端和服务端使用
 */

export const MODEL_PROVIDER = {
  OPENAI: "openai",
  ALIYUN: "aliyun",
  GEMINI: "gemini",
} as const;

export type ModelProvider =
  (typeof MODEL_PROVIDER)[keyof typeof MODEL_PROVIDER];

/**
 * 可用的聊天模型配置
 */
export interface ChatbotModel {
  name: string;
  icon: string;
  provider: string | null;
  model?: string; // 实际调用的模型名称
}

export const CHATBOT_MODELS: ChatbotModel[] = [
  {
    name: "Gemini",
    icon: "💎",
    provider: MODEL_PROVIDER.GEMINI, // 暂未配置
  },
  {
    name: "GPT-4.1",
    icon: "🌟",
    provider: MODEL_PROVIDER.OPENAI,
    model: "gpt-4.1",
  },
  {
    name: "qianwen",
    icon: "🌸",
    provider: MODEL_PROVIDER.ALIYUN,
    model:
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_ALIYUN_MODEL_NAME || "qwen-turbo"
        : "qwen-turbo",
  },
  {
    name: "Claude Sonnet 4",
    icon: "🎵",
    provider: null, // 暂未配置
  },
];
