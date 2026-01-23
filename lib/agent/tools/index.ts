/**
 * Agent Tools Module
 *
 * 架构设计：
 * - 使用建造者模式（Builder Pattern）构建工具实例
 * - 使用注册表模式（Registry Pattern）管理工具
 * - 使用策略模式（Strategy Pattern）加载工具
 * - 使用工厂模式（Factory Pattern）创建工具
 *
 * 模块组织：
 * - types.ts: 类型定义
 * - base.ts: 抽象基类
 * - registry.ts: 工具注册表
 * - loader.ts: 工具加载器
 * - *.ts: 具体工具实现
 *
 * 使用示例：
 * ```typescript
 * // 1. 获取工具加载器
 * const loader = getToolLoader();
 *
 * // 2. 加载所有工具
 * const result = await loader.load({
 *   config: { model, embeddings, apiKey }
 * });
 *
 * // 3. 使用工具
 * const tools = result.tools;
 * ```
 */

// 导出类型
export type {
  ToolMetadata,
  ToolConfig,
  IToolBuilder,
  ToolLoadOptions,
  ToolLoadResult,
} from "./types";

export { ToolCategory } from "./types";

// 导出基类
export { BaseToolBuilder } from "./base";

// 导出工具构建器
export { WeatherToolBuilder } from "./weather";
export { CalculatorToolBuilder } from "./calculator";
export { SearchWebToolBuilder } from "./search";
export { BrowserToolBuilder } from "./browser";

// 导出注册表和加载器
export { ToolRegistry } from "./registry";
export { ToolLoader, getToolLoader } from "./loader";

// 导出便捷函数
export { getInternalTools } from "./utils";
