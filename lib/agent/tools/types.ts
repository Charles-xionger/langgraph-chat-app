import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Embeddings } from "@langchain/core/embeddings";
import { z } from "zod";

/**
 * 工具类别枚举
 */
export enum ToolCategory {
  SEARCH = "search",
  UTILITY = "utility",
  BROWSER = "browser",
  DATA = "data",
  CUSTOM = "custom",
}

/**
 * 工具元数据
 */
export interface ToolMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  version: string;
  enabled: boolean;
  tags?: string[];
}

/**
 * 工具配置
 */
export interface ToolConfig {
  apiKey?: string;
  model?: BaseLanguageModel;
  embeddings?: Embeddings;
  [key: string]: any;
}

/**
 * 工具构建器接口
 */
export interface IToolBuilder {
  /**
   * 获取工具元数据
   */
  getMetadata(): ToolMetadata;

  /**
   * 构建工具实例
   * @param config 工具配置
   */
  build(
    config?: ToolConfig,
  ): Promise<DynamicStructuredTool> | DynamicStructuredTool;

  /**
   * 验证工具配置
   * @param config 工具配置
   */
  validateConfig(config?: ToolConfig): boolean;
}

/**
 * 工具加载选项
 */
export interface ToolLoadOptions {
  categories?: ToolCategory[];
  enabledOnly?: boolean;
  includeIds?: string[];
  excludeIds?: string[];
  config?: ToolConfig;
}

/**
 * 工具加载结果
 */
export interface ToolLoadResult {
  tools: DynamicStructuredTool[];
  metadata: ToolMetadata[];
  errors: Array<{ id: string; error: Error }>;
}
