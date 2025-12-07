import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function estimateTokens(messages?: any[]): number {
  if (!messages || messages.length === 0) return 0;
  const totalChars = messages.reduce(
    (acc: number, m: any) => acc + (m.content?.length || 0),
    0
  );
  return Math.round(totalChars / 4);
}
