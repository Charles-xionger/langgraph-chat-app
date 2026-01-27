import { BaseToolBuilder } from "./base";
import { ToolCategory, ToolConfig, ToolMetadata } from "./types";

/**
 * 网页浏览器工具构建器
 * 提供网页内容提取功能
 */
export class BrowserToolBuilder extends BaseToolBuilder {
  constructor() {
    const metadata: ToolMetadata = {
      id: "internal:web_browser",
      name: "web_browser",
      displayName: "Web Browser",
      description: "Browse web pages and extract full content",
      category: ToolCategory.BROWSER,
      version: "1.0.0",
      enabled: true,
      tags: ["browser", "web", "content"],
    };
    super(metadata);
  }

  validateConfig(config?: ToolConfig): boolean {
    if (!config?.model || !config?.embeddings) {
      console.warn(
        "Web browser tool requires 'model' and 'embeddings' in config",
      );
      return false;
    }
    return true;
  }

  async build(config?: ToolConfig) {
    this.requireConfig(config, "model");
    this.requireConfig(config, "embeddings");

    if (!config?.model || !config?.embeddings) {
      throw new Error("Model and embeddings are required for web browser tool");
    }

    // 动态导入以避免在模块加载时出错
    const { WebBrowser } = await import("@langchain/classic/tools/webbrowser");

    return new WebBrowser({
      model: config.model,
      embeddings: config.embeddings,
    }) as any; // Type assertion needed for compatibility
  }
}
