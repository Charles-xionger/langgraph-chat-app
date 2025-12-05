import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { WebBrowser } from "@langchain/classic/tools/webbrowser";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Embeddings } from "@langchain/core/embeddings";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import "dotenv/config";
/**
 * Mock weather tool using modern tool() API
 */
export const getWeatherTool = tool(
  async ({ location, unit }) => {
    // Mock weather data - in real implementation, call a weather API
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
    name: "get_weather",
    description: "Get current weather information for a specific location",
    schema: z.object({
      location: z.string().describe("The city or location to get weather for"),
      unit: z
        .enum(["celsius", "fahrenheit"])
        .default("celsius")
        .describe("Temperature unit"),
    }),
  }
);

export const calculator = tool(
  // 执行函数
  async (input) => {
    const { expression } = input;
    // 使用 eval 计算表达式（注意：实际应用中请避免使用 eval，改用安全的数学表达式解析库）
    try {
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      return `计算结果：${expression} = ${result}`;
    } catch (error) {
      return `计算错误：无法解析表达式 "${expression}"`;
    }
  },
  {
    // 工具元数据 名称、描述、模式(schema: 输入输出 schema)
    name: "calculator",
    description:
      "Calculate the result of a mathematical expression, e.g., 2 + 2",
    // schema 定义参数结构，LLM 会根据此生成正确的参数
    schema: z.object({
      expression: z
        .string()
        .describe("Mathematical expression to calculate: e.g., 2 + 2"),
    }),
  }
);

/**
 * Enhanced search tool that returns URLs and snippets
 */
export const searchWebTool = tool(
  async ({ query }) => {
    try {
      const serpapi = new SerpAPI(process.env.SERPAPI_API_KEY, {
        location: "Austin,Texas,United States",
        hl: "en",
        gl: "us",
      });

      const rawResult = await serpapi.invoke(query);

      // 打印完整的原始结果以便调试
      console.log("🚀 ~ SerpAPI rawResult (full):", rawResult);
      console.log("🚀 ~ SerpAPI rawResult type:", typeof rawResult);

      // SerpAPI 的 invoke 返回的是 JSON 字符串，需要解析
      // 但实际上它可能已经是对象了，取决于版本
      let parsedResults;

      if (typeof rawResult === "string") {
        parsedResults = JSON.parse(rawResult);
      } else {
        parsedResults = rawResult;
      }

      console.log(
        "🚀 ~ parsedResults:",
        JSON.stringify(parsedResults, null, 2)
      );

      // 检查是否有 organic_results
      if (
        parsedResults.organic_results &&
        Array.isArray(parsedResults.organic_results)
      ) {
        const formattedResults = parsedResults.organic_results
          .slice(0, 5)
          .map((r: any, i: number) => ({
            position: i + 1,
            title: r.title || "No title",
            url: r.link || r.url || "No URL",
            snippet: r.snippet || r.description || "No description",
            displayed_link: r.displayed_link,
            cached_page_link: r.cached_page_link,
          }));

        return JSON.stringify(
          {
            query,
            count: formattedResults.length,
            note: "These are search result snippets (previews). For full content, use web_browser tool with the URL.",
            results: formattedResults,
          },
          null,
          2
        );
      }

      // 如果没有 organic_results，直接返回原始结果
      return typeof rawResult === "string"
        ? rawResult
        : JSON.stringify(parsedResults, null, 2);
    } catch (error) {
      console.error("🚀 ~ searchWebTool error:", error);
      return JSON.stringify({
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  {
    name: "search_web",
    description:
      "Search the web and return URLs with brief snippets (previews only, not full content). Returns top 5 results. To get full page content, use the web_browser tool with the returned URLs.",
    schema: z.object({
      query: z.string().describe("The search query string"),
    }),
  }
);

/**
 * Get all internal tools
 */
export function getInternalTools(
  model: BaseLanguageModel,
  embeddings: Embeddings
) {
  return [
    getWeatherTool,
    calculator,
    searchWebTool,
    new WebBrowser({ model, embeddings }),
  ];
}
