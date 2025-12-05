"use client";

import type { ToolCallDisplayProps } from "./types";
import { WeatherCallCard } from "./WeatherCard";
import { CalculatorCallCard } from "./CalculatorCard";
import { GenericToolCallCard } from "./shared";

/**
 * 工具调用展示组件
 * 根据工具类型渲染对应的调用卡片
 */
export const ToolCallDisplay = ({ toolCall }: ToolCallDisplayProps) => {
  const { name, args } = toolCall;

  switch (name) {
    case "get_weather":
      return <WeatherCallCard args={args} />;
    case "calculator":
      return <CalculatorCallCard args={args} />;
    default:
      return <GenericToolCallCard name={name} args={args} />;
  }
};
