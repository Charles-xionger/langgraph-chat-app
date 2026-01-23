import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SerpAPI } from "@langchain/community/tools/serpapi";
import { BaseToolBuilder } from "./base";
import { ToolCategory, ToolConfig, ToolMetadata } from "./types";

/**
 * 网络搜索工具构建器
 * 使用 SerpAPI 提供搜索功能
 */
export class SearchWebToolBuilder extends BaseToolBuilder {
  constructor() {
    const metadata: ToolMetadata = {
      id: "internal:search_web",
      name: "search_web",
      displayName: "Web Search",
      description: "Search the web and return URLs with brief snippets",
      category: ToolCategory.SEARCH,
      version: "1.0.0",
      enabled: true,
      tags: ["search", "web", "google"],
    };
    super(metadata);
  }

  validateConfig(config?: ToolConfig): boolean {
    if (!config?.apiKey && !process.env.SERPAPI_API_KEY) {
      console.warn(
        "SERPAPI_API_KEY not found in config or environment variables",
      );
      return false;
    }
    return true;
  }

  build(config?: ToolConfig) {
    const apiKey = config?.apiKey || process.env.SERPAPI_API_KEY;

    return tool(
      async ({ query }) => {
        try {
          const serpapi = new SerpAPI(apiKey, {
            location: "Austin,Texas,United States",
            hl: "en",
            gl: "us",
          });

          const rawResult = await serpapi.invoke(query);

          // 解析结果
          let parsedResults;
          if (typeof rawResult === "string") {
            parsedResults = JSON.parse(rawResult);
          } else {
            parsedResults = rawResult;
          }

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
              2,
            );
          }

          return typeof rawResult === "string"
            ? rawResult
            : JSON.stringify(parsedResults, null, 2);
        } catch (error) {
          console.error("Search tool error:", error);
          return JSON.stringify({
            error: "Search failed",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
      {
        name: this.metadata.name,
        description:
          "Search the web and return URLs with brief snippets (previews only, not full content). Returns top 5 results. To get full page content, use the web_browser tool with the returned URLs.",
        schema: z.object({
          query: z.string().describe("The search query string"),
        }),
      },
    );
  }
}
