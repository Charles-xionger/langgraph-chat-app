/**
 * Agent Tools 使用示例
 *
 * 本文件展示如何使用新的工具加载系统
 */

import { getToolLoader, ToolCategory, ToolRegistry } from "@/lib/agent/tools";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * 示例 1: 基础使用 - 加载所有工具
 */
async function example1_loadAllTools() {
  console.log("\n=== 示例 1: 加载所有工具 ===\n");

  const loader = getToolLoader();
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const embeddings = new OpenAIEmbeddings();

  const result = await loader.load({
    config: {
      model,
      embeddings,
      apiKey: process.env.SERPAPI_API_KEY,
    },
  });

  console.log(`✅ 成功加载 ${result.tools.length} 个工具`);
  console.log(`⚠️  加载失败 ${result.errors.length} 个工具`);

  result.metadata.forEach((meta) => {
    console.log(`  - ${meta.displayName} (${meta.id})`);
  });

  if (result.errors.length > 0) {
    console.log("\n加载错误:");
    result.errors.forEach(({ id, error }) => {
      console.error(`  ❌ ${id}: ${error.message}`);
    });
  }

  return result.tools;
}

/**
 * 示例 2: 按类别加载工具
 */
async function example2_loadByCategory() {
  console.log("\n=== 示例 2: 按类别加载工具 ===\n");

  const loader = getToolLoader();

  // 只加载实用工具类
  const result = await loader.load({
    categories: [ToolCategory.UTILITY],
    config: {},
  });

  console.log(`✅ 加载了 ${result.tools.length} 个实用工具:`);
  result.metadata.forEach((meta) => {
    console.log(`  - ${meta.displayName}: ${meta.description}`);
  });

  return result.tools;
}

/**
 * 示例 3: 按 ID 加载特定工具
 */
async function example3_loadByIds() {
  console.log("\n=== 示例 3: 按 ID 加载特定工具 ===\n");

  const loader = getToolLoader();

  const result = await loader.loadByIds(
    ["internal:calculator", "internal:get_weather"],
    {},
  );

  console.log(`✅ 加载了 ${result.tools.length} 个指定工具:`);
  result.metadata.forEach((meta) => {
    console.log(`  - ${meta.name}`);
  });

  return result.tools;
}

/**
 * 示例 4: 排除特定工具
 */
async function example4_excludeTools() {
  console.log("\n=== 示例 4: 排除特定工具 ===\n");

  const loader = getToolLoader();
  const model = new ChatOpenAI({ modelName: "gpt-4" });
  const embeddings = new OpenAIEmbeddings();

  const result = await loader.load({
    excludeIds: ["internal:web_browser", "internal:search_web"],
    config: { model, embeddings },
  });

  console.log(`✅ 加载了 ${result.tools.length} 个工具（排除了浏览器和搜索）:`);
  result.metadata.forEach((meta) => {
    console.log(`  - ${meta.name}`);
  });

  return result.tools;
}

/**
 * 示例 5: 查看工具元数据
 */
async function example5_inspectMetadata() {
  console.log("\n=== 示例 5: 查看工具元数据 ===\n");

  const loader = getToolLoader();
  const metadata = loader.getAvailableTools();

  console.log(`📋 系统中注册了 ${metadata.length} 个工具:\n`);

  metadata.forEach((meta) => {
    console.log(`🔧 ${meta.displayName} (v${meta.version})`);
    console.log(`   ID: ${meta.id}`);
    console.log(`   描述: ${meta.description}`);
    console.log(`   类别: ${meta.category}`);
    console.log(`   状态: ${meta.enabled ? "✅ 启用" : "❌ 禁用"}`);
    if (meta.tags && meta.tags.length > 0) {
      console.log(`   标签: ${meta.tags.join(", ")}`);
    }
    console.log("");
  });
}

/**
 * 示例 6: 创建和注册自定义工具
 */
async function example6_customTool() {
  console.log("\n=== 示例 6: 创建和注册自定义工具 ===\n");

  const {
    BaseToolBuilder,
    ToolCategory,
    ToolRegistry,
  } = require("@/lib/agent/tools");
  const { tool } = require("@langchain/core/tools");
  const { z } = require("zod");

  // 创建自定义工具构建器
  class GreetingToolBuilder extends BaseToolBuilder {
    constructor() {
      super({
        id: "custom:greeting",
        name: "greeting",
        displayName: "Greeting Tool",
        description: "Generate a friendly greeting",
        category: ToolCategory.CUSTOM,
        version: "1.0.0",
        enabled: true,
        tags: ["greeting", "hello"],
      });
    }

    build(config?: any) {
      return tool(
        async ({
          name,
          language,
        }: {
          name: string;
          language: "en" | "zh" | "es" | "fr";
        }) => {
          const greetings: Record<string, string> = {
            en: `Hello, ${name}!`,
            zh: `你好，${name}！`,
            es: `¡Hola, ${name}!`,
            fr: `Bonjour, ${name}!`,
          };
          return greetings[language] || greetings.en;
        },
        {
          name: this.metadata.name,
          description: this.metadata.description,
          schema: z.object({
            name: z.string().describe("Name to greet"),
            language: z.enum(["en", "zh", "es", "fr"]).default("en"),
          }),
        },
      );
    }
  }

  // 注册自定义工具
  const registry = ToolRegistry.getInstance();
  registry.register(new GreetingToolBuilder());

  console.log("✅ 自定义工具已注册");

  // 加载并使用
  const loader = getToolLoader();
  const result = await loader.loadByIds(["custom:greeting"], {});

  console.log(`✅ 成功加载自定义工具: ${result.metadata[0]?.displayName}`);

  return result.tools;
}

/**
 * 示例 7: 按标签查询工具
 */
async function example7_queryByTag() {
  console.log("\n=== 示例 7: 按标签查询工具 ===\n");

  const registry = ToolRegistry.getInstance();

  // 查询所有包含 "math" 标签的工具
  const mathTools = registry.getByTag("math");

  console.log(`🔍 找到 ${mathTools.length} 个数学相关工具:`);
  mathTools.forEach((builder) => {
    const meta = builder.getMetadata();
    console.log(`  - ${meta.displayName}`);
  });

  // 查询所有搜索类工具
  const searchTools = registry.getByCategory(ToolCategory.SEARCH);

  console.log(`\n🔍 找到 ${searchTools.length} 个搜索类工具:`);
  searchTools.forEach((builder) => {
    const meta = builder.getMetadata();
    console.log(`  - ${meta.displayName}`);
  });
}

/**
 * 主函数 - 运行所有示例
 */
async function main() {
  console.log("🚀 Agent Tools 使用示例\n");
  console.log("=".repeat(50));

  try {
    // 运行所有示例
    await example1_loadAllTools();
    await example2_loadByCategory();
    await example3_loadByIds();
    await example4_excludeTools();
    await example5_inspectMetadata();
    await example6_customTool();
    await example7_queryByTag();

    console.log("\n" + "=".repeat(50));
    console.log("✅ 所有示例运行完成！");
  } catch (error) {
    console.error("❌ 示例运行失败:", error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

// 导出示例函数供其他地方使用
export {
  example1_loadAllTools,
  example2_loadByCategory,
  example3_loadByIds,
  example4_excludeTools,
  example5_inspectMetadata,
  example6_customTool,
  example7_queryByTag,
};
