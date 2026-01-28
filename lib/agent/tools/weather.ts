import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseToolBuilder } from "./base";
import { ToolCategory, ToolConfig, ToolMetadata } from "./types";

/**
 * 天气工具构建器
 * 提供天气查询功能（当前为 Mock 数据）
 */
export class WeatherToolBuilder extends BaseToolBuilder {
  constructor() {
    const metadata: ToolMetadata = {
      id: "internal:get_weather",
      name: "get_weather",
      displayName: "Weather Information",
      description: "Get current weather information for a specific location",
      category: ToolCategory.UTILITY,
      version: "1.0.0",
      enabled: true,
      tags: ["weather", "location", "temperature"],
    };
    super(metadata);
  }

  build(config?: ToolConfig) {
    return tool(
      async ({ location, unit }) => {
        // Mock weather data - in production, call a real weather API
        const mockData = {
          location,
          temperature: unit === "fahrenheit" ? "72°F" : "22°C",
          condition: "Partly cloudy",
          humidity: "65%",
          windSpeed: "8 km/h",
          timestamp: new Date().toISOString(),
        };

        return JSON.stringify({
          success: true,
          data: mockData,
          message: `Weather information for ${location}`,
        });
      },
      {
        name: this.metadata.name,
        description: this.metadata.description,
        schema: z.object({
          location: z
            .string()
            .describe("The city or location to get weather for"),
          unit: z
            .enum(["celsius", "fahrenheit"])
            .default("celsius")
            .describe("Temperature unit"),
        }),
      },
    );
  }
}
