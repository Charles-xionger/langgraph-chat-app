import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseToolBuilder } from "./base";
import { ToolCategory, ToolConfig, ToolMetadata } from "./types";

/**
 * 计算器工具构建器
 * 提供数学表达式计算功能
 */
export class CalculatorToolBuilder extends BaseToolBuilder {
  constructor() {
    const metadata: ToolMetadata = {
      id: "internal:calculator",
      name: "calculator",
      displayName: "Calculator",
      description: "Calculate mathematical expressions",
      category: ToolCategory.UTILITY,
      version: "1.0.0",
      enabled: true,
      tags: ["math", "calculation", "arithmetic"],
    };
    super(metadata);
  }

  build(config?: ToolConfig) {
    return tool(
      async (input) => {
        const { expression } = input;

        try {
          // 使用 Function 构造器代替 eval，更安全
          // 限制只能使用数学运算符
          const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
          if (sanitized !== expression) {
            return `计算错误：表达式包含非法字符`;
          }

          // eslint-disable-next-line no-new-func
          const result = new Function(`"use strict"; return (${sanitized})`)();

          return `计算结果：${expression} = ${result}`;
        } catch (error) {
          return `计算错误：无法解析表达式 "${expression}"`;
        }
      },
      {
        name: this.metadata.name,
        description: this.metadata.description,
        schema: z.object({
          expression: z
            .string()
            .describe("Mathematical expression to calculate, e.g., 2 + 2"),
        }),
      },
    );
  }
}
