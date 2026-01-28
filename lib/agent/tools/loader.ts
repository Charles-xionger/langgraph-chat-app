import { DynamicStructuredTool } from "@langchain/core/tools";
import { ToolRegistry } from "./registry";
import {
  ToolLoadOptions,
  ToolLoadResult,
  ToolMetadata,
  ToolConfig,
  ToolCategory,
} from "./types";

/**
 * 工具加载器
 * 使用策略模式根据不同条件加载工具
 */
export class ToolLoader {
  private registry: ToolRegistry;

  constructor(registry?: ToolRegistry) {
    this.registry = registry || ToolRegistry.getInstance();
  }

  /**
   * 加载工具
   * @param options 加载选项
   * @returns 工具加载结果
   */
  async load(options: ToolLoadOptions = {}): Promise<ToolLoadResult> {
    const {
      categories,
      enabledOnly = true,
      includeIds,
      excludeIds,
      config,
    } = options;

    const tools: DynamicStructuredTool[] = [];
    const metadata: ToolMetadata[] = [];
    const errors: Array<{ id: string; error: Error }> = [];

    // 获取所有构建器
    let builders = this.registry.getAll();

    // 根据类别过滤
    if (categories && categories.length > 0) {
      builders = builders.filter((builder) =>
        categories.includes(builder.getMetadata().category),
      );
    }

    // 根据启用状态过滤
    if (enabledOnly) {
      builders = builders.filter((builder) => builder.getMetadata().enabled);
    }

    // 根据包含列表过滤
    if (includeIds && includeIds.length > 0) {
      builders = builders.filter((builder) =>
        includeIds.includes(builder.getMetadata().id),
      );
    }

    // 根据排除列表过滤
    if (excludeIds && excludeIds.length > 0) {
      builders = builders.filter(
        (builder) => !excludeIds.includes(builder.getMetadata().id),
      );
    }

    // 构建工具实例
    for (const builder of builders) {
      const toolMetadata = builder.getMetadata();

      try {
        // 验证配置
        if (!builder.validateConfig(config)) {
          console.warn(
            `⚠️ Skipping tool ${toolMetadata.id}: configuration validation failed`,
          );
          continue;
        }

        // 构建工具
        const tool = await Promise.resolve(builder.build(config));
        tools.push(tool);
        metadata.push(toolMetadata);

        console.log(`✅ Loaded tool: ${toolMetadata.id}`);
      } catch (error) {
        console.error(`❌ Failed to load tool ${toolMetadata.id}:`, error);
        errors.push({
          id: toolMetadata.id,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return { tools, metadata, errors };
  }

  /**
   * 按类别加载工具
   */
  async loadByCategory(
    category: ToolCategory,
    config?: ToolConfig,
  ): Promise<ToolLoadResult> {
    return this.load({
      categories: [category],
      config,
    });
  }

  /**
   * 按 ID 列表加载工具
   */
  async loadByIds(ids: string[], config?: ToolConfig): Promise<ToolLoadResult> {
    return this.load({
      includeIds: ids,
      config,
    });
  }

  /**
   * 加载所有工具
   */
  async loadAll(config?: ToolConfig): Promise<ToolLoadResult> {
    return this.load({
      enabledOnly: false,
      config,
    });
  }

  /**
   * 获取可用工具的元数据列表
   */
  getAvailableTools(): ToolMetadata[] {
    return this.registry.getAllMetadata();
  }
}

/**
 * 获取默认工具加载器实例
 */
export function getToolLoader(): ToolLoader {
  return new ToolLoader();
}
