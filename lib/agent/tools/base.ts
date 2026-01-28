import { DynamicStructuredTool } from "@langchain/core/tools";
import { IToolBuilder, ToolConfig, ToolMetadata } from "./types";

/**
 * 抽象工具构建器基类
 * 使用建造者模式，提供统一的工具构建接口
 */
export abstract class BaseToolBuilder implements IToolBuilder {
  protected metadata: ToolMetadata;

  constructor(metadata: ToolMetadata) {
    this.metadata = metadata;
  }

  /**
   * 获取工具元数据
   */
  getMetadata(): ToolMetadata {
    return { ...this.metadata };
  }

  /**
   * 构建工具实例
   * 子类必须实现此方法
   */
  abstract build(
    config?: ToolConfig,
  ): Promise<DynamicStructuredTool> | DynamicStructuredTool;

  /**
   * 验证工具配置
   * 子类可以重写此方法以提供自定义验证逻辑
   */
  validateConfig(config?: ToolConfig): boolean {
    return true;
  }

  /**
   * 检查必需的配置字段
   */
  protected requireConfig(config: ToolConfig | undefined, field: string): void {
    if (!config || !(field in config)) {
      throw new Error(
        `Configuration field '${field}' is required for tool '${this.metadata.name}'`,
      );
    }
  }

  /**
   * 获取配置值或默认值
   */
  protected getConfigValue<T>(
    config: ToolConfig | undefined,
    field: string,
    defaultValue: T,
  ): T {
    if (!config || !(field in config)) {
      return defaultValue;
    }
    return config[field] as T;
  }
}
