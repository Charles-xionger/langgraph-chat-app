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
 * - mcpUrl: MCP 服务器 URL（可选，默认使用环境变量 DEFAULT_MCP_URL）
 *
 * Response:
 * {
 *   internal: ToolMetadata[],  // 内置工具
 *   mcp: ToolMetadata[],        // MCP 工具
 *   mcpUrl: string              // 使用的 MCP URL
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mcpUrl =
      searchParams.get("mcpUrl") ||
      process.env.DEFAULT_MCP_URL ||
      "https://drawing-mcp.xiongerer.xyz/mcp";

    console.log(`📋 Fetching tools metadata for MCP URL: ${mcpUrl}`);

    // 获取内置工具元数据
    const internalTools = getInternalToolsMetadata();

    // 获取 MCP 工具元数据（如果未缓存则加载）
    let mcpTools: ToolMetadata[] = [];
    const cachedMcpTools = getMCPToolsMetadata(mcpUrl);

    if (cachedMcpTools) {
      mcpTools = cachedMcpTools;
      console.log(
        `✅ Using cached MCP tools metadata: ${mcpTools.length} tools`,
      );
    } else {
      console.log(`⚠️  MCP tools not yet loaded for: ${mcpUrl}`);
      console.log(`   Loading tools now...`);
      try {
        // 加载 MCP 工具（这会同时缓存工具和元数据）
        await warmupMCPTools(mcpUrl);
        // 再次尝试获取元数据
        const loadedMcpTools = getMCPToolsMetadata(mcpUrl);
        if (loadedMcpTools) {
          mcpTools = loadedMcpTools;
          console.log(`✅ Loaded ${mcpTools.length} MCP tools`);
        }
      } catch (error) {
        console.error(`❌ Failed to load MCP tools:`, error);
        // 继续执行，返回空的 MCP 工具列表
      }
    }

    return NextResponse.json({
      internal: internalTools,
      mcp: mcpTools,
      mcpUrl,
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
