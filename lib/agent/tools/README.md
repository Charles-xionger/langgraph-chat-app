# Agent Tools 架构文档

## 概述

重构后的工具系统采用模块化设计，使用多种设计模式提供灵活、可扩展的工具管理能力。

## 架构设计

### 设计模式

1. **建造者模式（Builder Pattern）**
   - 每个工具都有对应的 Builder 类
   - 负责创建和配置工具实例
   - 提供统一的构建接口

2. **注册表模式（Registry Pattern）**
   - `ToolRegistry` 集中管理所有工具构建器
   - 支持动态注册和注销工具
   - 提供查询和过滤功能

3. **策略模式（Strategy Pattern）**
   - `ToolLoader` 根据不同策略加载工具
   - 支持按类别、ID、标签等多种加载方式

4. **单例模式（Singleton Pattern）**
   - `ToolRegistry` 使用单例确保全局唯一

## 文件结构

```
lib/agent/tools/
├── index.ts          # 主导出文件
├── types.ts          # TypeScript 类型定义
├── base.ts           # 抽象基类
├── registry.ts       # 工具注册表
├── loader.ts         # 工具加载器
├── utils.ts          # 工具函数
├── weather.ts        # 天气工具
├── calculator.ts     # 计算器工具
├── search.ts         # 搜索工具
└── browser.ts        # 浏览器工具
```

## 核心组件

### 1. 类型定义（types.ts）

```typescript
// 工具类别
enum ToolCategory {
  SEARCH = "search",
  UTILITY = "utility",
  BROWSER = "browser",
  DATA = "data",
  CUSTOM = "custom",
}

// 工具元数据
interface ToolMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  version: string;
  enabled: boolean;
  tags?: string[];
}

// 工具配置
interface ToolConfig {
  apiKey?: string;
  model?: BaseLanguageModel;
  embeddings?: Embeddings;
  [key: string]: any;
}

// 工具构建器接口
interface IToolBuilder {
  getMetadata(): ToolMetadata;
  build(config?: ToolConfig): DynamicStructuredTool;
  validateConfig(config?: ToolConfig): boolean;
}
```

### 2. 基础类（base.ts）

抽象基类 `BaseToolBuilder` 提供：

- 元数据管理
- 配置验证
- 工具助手方法

### 3. 工具注册表（registry.ts）

`ToolRegistry` 提供：

- 注册/注销工具
- 查询工具（按 ID、类别、标签）
- 获取工具元数据

### 4. 工具加载器（loader.ts）

`ToolLoader` 提供：

- 灵活的加载选项
- 按条件过滤工具
- 错误处理和报告

## 使用指南

### 基础使用

```typescript
import { getToolLoader } from "@/lib/agent/tools";

// 1. 获取工具加载器
const loader = getToolLoader();

// 2. 加载所有启用的工具
const result = await loader.load({
  config: {
    model: myModel,
    embeddings: myEmbeddings,
    apiKey: process.env.SERPAPI_API_KEY,
  },
});

// 3. 使用工具
const tools = result.tools;
const agent = createAgent({ tools });
```

### 按类别加载

```typescript
import { ToolCategory } from "@/lib/agent/tools";

// 只加载搜索类工具
const result = await loader.load({
  categories: [ToolCategory.SEARCH],
  config: { apiKey: "your-api-key" },
});
```

### 按 ID 加载

```typescript
// 只加载特定工具
const result = await loader.loadByIds(
  ["internal:calculator", "internal:get_weather"],
  config,
);
```

### 排除特定工具

```typescript
// 加载除了浏览器工具外的所有工具
const result = await loader.load({
  excludeIds: ["internal:web_browser"],
  config,
});
```

### 加载所有工具（包括禁用的）

```typescript
const result = await loader.loadAll(config);
```

### 获取工具元数据

```typescript
// 获取所有可用工具的元数据
const metadata = loader.getAvailableTools();

metadata.forEach((meta) => {
  console.log(`${meta.displayName}: ${meta.description}`);
});
```

## 创建自定义工具

### 1. 创建工具构建器

```typescript
// lib/agent/tools/my-custom-tool.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseToolBuilder } from "./base";
import { ToolCategory, ToolConfig, ToolMetadata } from "./types";

export class MyCustomToolBuilder extends BaseToolBuilder {
  constructor() {
    const metadata: ToolMetadata = {
      id: "custom:my_tool",
      name: "my_tool",
      displayName: "My Custom Tool",
      description: "Does something awesome",
      category: ToolCategory.CUSTOM,
      version: "1.0.0",
      enabled: true,
      tags: ["custom", "awesome"],
    };
    super(metadata);
  }

  // 可选：验证配置
  validateConfig(config?: ToolConfig): boolean {
    // 检查必需的配置项
    if (!config?.myRequiredField) {
      console.warn("myRequiredField is required");
      return false;
    }
    return true;
  }

  build(config?: ToolConfig) {
    return tool(
      async ({ input }) => {
        // 工具逻辑
        return `Result: ${input}`;
      },
      {
        name: this.metadata.name,
        description: this.metadata.description,
        schema: z.object({
          input: z.string().describe("Input parameter"),
        }),
      },
    );
  }
}
```

### 2. 注册自定义工具

```typescript
import { ToolRegistry } from "@/lib/agent/tools";
import { MyCustomToolBuilder } from "./tools/my-custom-tool";

// 获取注册表实例
const registry = ToolRegistry.getInstance();

// 注册自定义工具
registry.register(new MyCustomToolBuilder());

// 现在可以通过 loader 加载
const loader = getToolLoader();
const result = await loader.load({
  includeIds: ["custom:my_tool"],
  config: { myRequiredField: "value" },
});
```

## 错误处理

```typescript
const result = await loader.load({ config });

// 检查加载错误
if (result.errors.length > 0) {
  console.error("Tool loading errors:");
  result.errors.forEach(({ id, error }) => {
    console.error(`- ${id}: ${error.message}`);
  });
}

// 使用成功加载的工具
console.log(`Successfully loaded ${result.tools.length} tools`);
```

## 工具元数据示例

```typescript
{
  id: "internal:calculator",
  name: "calculator",
  displayName: "Calculator",
  description: "Calculate mathematical expressions",
  category: "utility",
  version: "1.0.0",
  enabled: true,
  tags: ["math", "calculation", "arithmetic"]
}
```

## 向后兼容

原有的 `tools.ts` 文件仍然保留，重新导出新模块的接口：

```typescript
// 旧代码仍然可以工作
import { getInternalTools } from "@/lib/agent/tools";

const tools = await getInternalTools(model, embeddings);
```

## 最佳实践

1. **配置验证**：在 `validateConfig` 中检查必需的配置项
2. **错误处理**：构建工具时捕获并记录错误
3. **元数据完整**：提供完整的工具元数据，包括描述和标签
4. **测试**：为每个工具编写单元测试
5. **文档**：在工具描述中说明使用方法和限制

## 性能优化

1. **延迟加载**：只在需要时加载工具
2. **配置缓存**：避免重复验证相同的配置
3. **异步构建**：支持异步工具构建

## 扩展性

系统设计支持：

- ✅ 动态注册工具
- ✅ 插件化工具
- ✅ 远程工具加载
- ✅ 工具版本管理
- ✅ 工具依赖管理

## 迁移指南

### 从旧 API 迁移

**旧方式：**

```typescript
import { getInternalTools } from "@/lib/agent/tools";
const tools = getInternalTools(model, embeddings);
```

**新方式：**

```typescript
import { getToolLoader } from "@/lib/agent/tools";
const loader = getToolLoader();
const result = await loader.load({
  config: { model, embeddings },
});
const tools = result.tools;
```

## 常见问题

### Q: 如何禁用某个工具？

通过 `excludeIds` 选项：

```typescript
await loader.load({
  excludeIds: ["internal:search_web"],
});
```

### Q: 如何添加自定义配置？

在 `ToolConfig` 中添加任意字段：

```typescript
const result = await loader.load({
  config: {
    model,
    embeddings,
    customField: "value",
  },
});
```

### Q: 工具加载失败怎么办？

检查 `result.errors` 数组获取详细错误信息。

## 总结

新的工具系统提供：

- 🏗️ 模块化设计，易于维护
- 🔧 灵活的工具加载策略
- 📦 完整的 TypeScript 类型支持
- 🔌 插件化架构，易于扩展
- 🧪 可测试性强
- 📚 清晰的文档和示例
