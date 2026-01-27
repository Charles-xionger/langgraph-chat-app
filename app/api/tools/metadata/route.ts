import { NextRequest, NextResponse } from "next/server";
import {
  getMCPToolsMetadata,
  getInternalToolsMetadata,
  warmupMCPTools,
  type ToolMetadata,
} from "@/lib/agent";

/**
 * GET /api/tools/metadata
 *
 * 获取可用工具的元数据列表
 *
 * Query Parameters:
 * - mcpUrl: MCP 服务器 URL（可选，旧参数，向后兼容）
 * - mcpConfigs: JSON 字符串，包含 MCP 配置数组（可选）
 *   格式: [{ url: string, headers?: Record<string, string> }]
 *
 * Response:
 * {
 *   internal: ToolMetadata[],  // 内置工具
 *   mcp: ToolMetadata[],        // MCP 工具（来自所有配置的工具合并）
 *   mcpConfigs: any[]           // 使用的 MCP 配置
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mcpUrl = searchParams.get("mcpUrl");
    const mcpConfigsParam = searchParams.get("mcpConfigs");

    // 解析 MCP 配置
    let mcpConfigs: Array<{ url: string; headers?: Record<string, string> }> =
      [];

    if (mcpConfigsParam) {
      try {
        const parsed = JSON.parse(mcpConfigsParam);
        if (Array.isArray(parsed)) {
          mcpConfigs = parsed;
        }
      } catch (error) {
        console.error("❌ Failed to parse mcpConfigs:", error);
      }
    } else if (mcpUrl) {
      // 向后兼容：如果只有 mcpUrl，创建一个简单的配置
      mcpConfigs = [{ url: mcpUrl }];
    }

    console.log(
      `📋 Fetching tools metadata${mcpConfigs.length > 0 ? ` for ${mcpConfigs.length} MCP config(s)` : " (no MCP URL provided)"}`,
    );

    // 获取内置工具元数据
    const internalTools = getInternalToolsMetadata();

    // 获取 MCP 工具元数据（仅当提供了配置时）
    let mcpTools: ToolMetadata[] = [];

    if (mcpConfigs.length === 0) {
      console.log("⚠️  No MCP URL provided, skipping MCP tools loading");
      return NextResponse.json({
        internal: internalTools,
        mcp: [],
        mcpConfigs: [],
      });
    }

    // 从所有 MCP 配置中加载工具
    for (const config of mcpConfigs) {
      try {
        const cachedMcpTools = getMCPToolsMetadata(config);

        if (cachedMcpTools) {
          mcpTools.push(...cachedMcpTools);
          console.log(
            `✅ Using cached MCP tools metadata from ${config.url}: ${cachedMcpTools.length} tools`,
          );
        } else {
          console.log(`⚠️  MCP tools not yet loaded for: ${config.url}`);
          console.log(`   Loading tools now...`);
          try {
            // 加载 MCP 工具（这会同时缓存工具和元数据）
            await warmupMCPTools(config);
            // 再次尝试获取元数据
            const loadedMcpTools = getMCPToolsMetadata(config);
            if (loadedMcpTools) {
              mcpTools.push(...loadedMcpTools);
              console.log(`✅ Loaded ${loadedMcpTools.length} MCP tools`);
            }
          } catch (error) {
            console.error(
              `❌ Failed to load MCP tools from ${config.url}:`,
              error,
            );
            // 继续处理其他配置
          }
        }
      } catch (error) {
        console.error(`❌ Error processing MCP config ${config.url}:`, error);
        // 继续处理其他配置
      }
    }

    return NextResponse.json({
      internal: internalTools,
      mcp: mcpTools,
      mcpConfigs,
    });
  } catch (error) {
    console.error("❌ Error fetching tools metadata:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tools metadata",
        message: error instanceof Error ? error.message : "Unknown error",
        // 降级：至少返回内置工具
        internal: getInternalToolsMetadata(),
        mcp: [],
      },
      { status: 500 },
    );
  }
}
