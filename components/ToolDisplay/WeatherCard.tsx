"use client";

import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  Clock,
} from "lucide-react";
import type { ToolCallCardProps, ToolResultCardProps } from "./types";

// ==================== 天气调用卡片 ====================

export const WeatherCallCard = ({ args }: ToolCallCardProps) => {
  const location = (args.location as string) || "未知位置";
  const unit = (args.unit as string) || "celsius";

  return (
    <div className="flex items-center gap-3 stardew-box rounded-lg p-3 border-2 border-[#4FC3F7] dark:border-[#4FC3F7]/70">
      <div className="flex h-10 w-10 items-center justify-center rounded-full inventory-slot">
        <Cloud className="h-5 w-5 text-[#4FC3F7]" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-[--stardew-text] dark:text-[--stardew-parchment]">
          ☁️ 查询天气
        </p>
        <p className="text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
          📍 {location} · {unit === "fahrenheit" ? "华氏" : "摄氏"}
        </p>
      </div>
      <div className="animate-pulse text-xs text-[#4FC3F7] pixel-text">
        查询中...
      </div>
    </div>
  );
};

// ==================== 天气结果卡片 ====================

interface WeatherData {
  success?: boolean;
  data?: {
    location?: string;
    temperature?: string;
    condition?: string;
    humidity?: string;
    windSpeed?: string;
    timestamp?: string;
  };
  message?: string;
  raw?: string;
}

interface WeatherResultCardProps {
  data: WeatherData;
}

export const WeatherResultCard = ({ data }: WeatherResultCardProps) => {
  if (!data.success || !data.data) {
    return (
      <div className="stardew-box rounded-lg p-3 border-2 border-red-600 dark:border-red-500">
        <p className="text-sm text-red-700 dark:text-red-400">
          ⚠️ 获取天气失败: {data.raw || "未知错误"}
        </p>
      </div>
    );
  }

  const weather = data.data;
  const WeatherIcon = getWeatherIcon(weather.condition || "");

  return (
    <div className="overflow-hidden stardew-box rounded-xl border-4 border-[#4FC3F7] dark:border-[#4FC3F7]/70">
      {/* 主要信息 */}
      <div className="p-4 bg-gradient-to-br from-[#87CEEB]/20 to-[#4FC3F7]/20 dark:from-[#87CEEB]/10 dark:to-[#4FC3F7]/10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[--stardew-wood] dark:text-[--stardew-wood-light]">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{weather.location}</span>
            </div>
            <div className="mt-2 text-4xl font-bold tracking-tight text-[#4FC3F7] drop-shadow-sm pixel-text">
              {weather.temperature}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-[--stardew-text] dark:text-[--stardew-parchment]">
              <WeatherIcon className="h-4 w-4" />
              <span>{weather.condition}</span>
            </div>
          </div>
          <WeatherIcon className="h-16 w-16 text-[#4FC3F7]/30" />
        </div>

        {/* 详细信息 */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t-2 border-[#552814] dark:border-[#8B6F47] pt-3">
          <div className="flex items-center gap-1.5 text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
            <Droplets className="h-3.5 w-3.5" />
            <span>湿度 {weather.humidity}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
            <Wind className="h-3.5 w-3.5" />
            <span>风速 {weather.windSpeed}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[--stardew-wood] dark:text-[--stardew-wood-light]">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTime(weather.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== 辅助函数 ====================

function getWeatherIcon(condition: string) {
  const lower = condition.toLowerCase();
  if (lower.includes("rain") || lower.includes("雨")) return CloudRain;
  if (lower.includes("snow") || lower.includes("雪")) return CloudSnow;
  if (lower.includes("thunder") || lower.includes("雷")) return CloudLightning;
  if (lower.includes("cloud") || lower.includes("云") || lower.includes("阴"))
    return Cloud;
  if (lower.includes("sun") || lower.includes("晴") || lower.includes("clear"))
    return Sun;
  return Cloud;
}

function formatTime(timestamp?: string) {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
