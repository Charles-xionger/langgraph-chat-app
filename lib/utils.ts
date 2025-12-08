import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { encode } from "gpt-tokenizer";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cls = (...c: (string | boolean | undefined | null)[]): string =>
  c.filter(Boolean).join(" ");

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // 小于1分钟
  if (diffSec < 60) {
    return "刚刚";
  }

  // 小于1小时
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}分钟前`;
  }

  // 小于1天
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}小时前`;
  }

  // 小于30天
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) {
    return `${diffDay}天前`;
  }

  // 小于12个月
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  }

  // 超过1年
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}年前`;
}

export const makeId = (prefix: string): string =>
  `${prefix}${Math.random().toString(36).slice(2, 10)}`;

/**
 * 使用 gpt-tokenizer 计算消息的准确 token 数
 * 适用于 GPT-4 和其他 OpenAI 兼容模型
 */
export function estimateTokens(messages?: any[]): number {
  if (!messages || messages.length === 0) return 0;

  let totalTokens = 0;

  for (const message of messages) {
    // 处理不同类型的内容
    let content = "";

    if (typeof message.content === "string") {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      // 处理复杂内容（如工具调用等）
      content = message.content
        .map((item: any) => {
          if (typeof item === "string") return item;
          if (item.text) return item.text;
          if (item.functionCall) return JSON.stringify(item.functionCall);
          return JSON.stringify(item);
        })
        .join("");
    }

    // 使用 gpt-tokenizer 编码
    if (content) {
      try {
        const tokens = encode(content);
        totalTokens += tokens.length;
      } catch (error) {
        // 降级到字符估算
        totalTokens += Math.round(content.length / 4);
      }
    }

    // 为消息元数据添加固定 token（role, name 等）
    totalTokens += 4; // 每条消息的固定开销
  }

  return totalTokens;
}

/**
 * 获取能量等级状态
 */
export function getEnergyStatus(tokens: number) {
  if (tokens < 2000) {
    return {
      icon: "🌱",
      color: "text-[#5DCC52]",
      label: "充沛",
      barColor: "from-[#5DCC52] to-[#7FE89A]",
    };
  }
  if (tokens < 5000) {
    return {
      icon: "🌿",
      color: "text-[#FFD700]",
      label: "良好",
      barColor: "from-[#FFD700] to-[#FFA500]",
    };
  }
  if (tokens < 10000) {
    return {
      icon: "⚡",
      color: "text-[#FFA500]",
      label: "注意",
      barColor: "from-[#FFA500] to-[#FF8C00]",
    };
  }
  return {
    icon: "🔥",
    color: "text-[#FF6B6B]",
    label: "高消耗",
    barColor: "from-[#FF6B6B] to-[#D84545]",
  };
}
