import { IToolBuilder } from "./types";
import { WeatherToolBuilder } from "./weather";
import { CalculatorToolBuilder } from "./calculator";
import { SearchWebToolBuilder } from "./search";
import { BrowserToolBuilder } from "./browser";

/**
 * 工具注册表
 * 使用注册表模式管理所有可用的工具构建器
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private builders: Map<string, IToolBuilder> = new Map();

  private constructor() {
    // 注册内置工具
    this.registerDefaultTools();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * 注册默认工具
   */
  private registerDefaultTools(): void {
    this.register(new WeatherToolBuilder());
    this.register(new CalculatorToolBuilder());
    this.register(new SearchWebToolBuilder());
    this.register(new BrowserToolBuilder());
  }

  /**
   * 注册工具构建器
   */
  register(builder: IToolBuilder): void {
    const metadata = builder.getMetadata();
    this.builders.set(metadata.id, builder);
    console.log(`✅ Registered tool: ${metadata.id} (${metadata.displayName})`);
  }

  /**
   * 注销工具构建器
   */
  unregister(id: string): boolean {
    return this.builders.delete(id);
  }

  /**
   * 获取工具构建器
   */
  get(id: string): IToolBuilder | undefined {
    return this.builders.get(id);
  }

  /**
   * 获取所有工具构建器
   */
  getAll(): IToolBuilder[] {
    return Array.from(this.builders.values());
  }

  /**
   * 获取所有工具元数据
   */
  getAllMetadata() {
    return this.getAll().map((builder) => builder.getMetadata());
  }

  /**
   * 按类别获取工具构建器
   */
  getByCategory(category: string): IToolBuilder[] {
    return this.getAll().filter(
      (builder) => builder.getMetadata().category === category,
    );
  }

  /**
   * 按标签获取工具构建器
   */
  getByTag(tag: string): IToolBuilder[] {
    return this.getAll().filter((builder) =>
      builder.getMetadata().tags?.includes(tag),
    );
  }

  /**
   * 检查工具是否已注册
   */
  has(id: string): boolean {
    return this.builders.has(id);
  }

  /**
   * 清空所有工具
   */
  clear(): void {
    this.builders.clear();
  }

  /**
   * 重新加载默认工具
   */
  reset(): void {
    this.clear();
    this.registerDefaultTools();
  }
}
