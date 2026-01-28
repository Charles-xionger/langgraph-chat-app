import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { Embeddings } from "@langchain/core/embeddings";
import { getToolLoader } from "./loader";
import { ToolConfig } from "./types";

/**
 * 获取所有内置工具（兼容旧 API）
 * @param model LLM 模型
 * @param embeddings 嵌入模型
 * @returns 工具数组
 */
export async function getInternalTools(
  model: BaseLanguageModel,
  embeddings: Embeddings,
): Promise<DynamicStructuredTool[]> {
  const loader = getToolLoader();

  const config: ToolConfig = {
    model,
    embeddings,
    apiKey: process.env.SERPAPI_API_KEY,
  };

  const result = await loader.load({ config });

  if (result.errors.length > 0) {
    console.warn("⚠️ Some tools failed to load:", result.errors);
  }

  console.log(`✅ Loaded ${result.tools.length} internal tools`);

  return result.tools;
}
