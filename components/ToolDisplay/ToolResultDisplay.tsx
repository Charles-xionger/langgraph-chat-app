"use client";

import { useMemo } from "react";
import type { ToolResultDisplayProps } from "./types";
import { WeatherResultCard } from "./WeatherCard";
import { CalculatorResultCard } from "./CalculatorCard";
import { GenericToolResultCard } from "./shared";

/**
 * 工具结果展示组件
 * 根据工具类型渲染对应的结果卡片
 */
export const ToolResultDisplay = ({ data }: ToolResultDisplayProps) => {
  const { name, content } = data;

  // 尝试解析 JSON 内容
  const parsedContent = useMemo(() => {
    try {
      return typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      return { raw: content };
    }
  }, [content]);

  switch (name) {
    case "get_weather":
      return <WeatherResultCard data={parsedContent} />;
    case "calculator":
      return <CalculatorResultCard content={content} />;
    default:
      return <GenericToolResultCard name={name} content={content} />;
  }
};
