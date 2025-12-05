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
    <div className="flex items-center gap-3 rounded-lg border border-sky-200/60 bg-[linear-gradient(135deg,#87CEEB30,#4FC3F730,#00BFFF20)] p-3 dark:border-sky-600/40 dark:bg-[linear-gradient(135deg,#87CEEB20,#4FC3F720,#00BFFF15)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100/80 dark:bg-sky-900/50">
        <Cloud className="h-5 w-5 text-sky-500 dark:text-sky-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          查询天气
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          📍 {location} · {unit === "fahrenheit" ? "华氏" : "摄氏"}
        </p>
      </div>
      <div className="animate-pulse text-xs text-sky-500 dark:text-sky-400">
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
      <div className="rounded-lg border border-red-200/60 bg-red-50/50 p-3 dark:border-red-800/40 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400">
          获取天气失败: {data.raw || "未知错误"}
        </p>
      </div>
    );
  }

  const weather = data.data;
  const WeatherIcon = getWeatherIcon(weather.condition || "");

  return (
    <div className="overflow-hidden rounded-xl border border-sky-300/60 bg-[linear-gradient(135deg,#87CEEB,#4FC3F7,#00BFFF)] shadow-lg shadow-sky-200/30 dark:border-sky-600/40 dark:bg-[linear-gradient(135deg,#87CEEBcc,#4FC3F7cc,#00BFFFcc)] dark:shadow-sky-900/20">
      {/* 主要信息 */}
      <div className="p-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-white/80">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">{weather.location}</span>
            </div>
            <div className="mt-2 text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              {weather.temperature}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <WeatherIcon className="h-4 w-4" />
              <span>{weather.condition}</span>
            </div>
          </div>
          <WeatherIcon className="h-16 w-16 text-white/20" />
        </div>

        {/* 详细信息 */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-3">
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <Droplets className="h-3.5 w-3.5" />
            <span>湿度 {weather.humidity}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/80">
            <Wind className="h-3.5 w-3.5" />
            <span>风速 {weather.windSpeed}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/80">
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
