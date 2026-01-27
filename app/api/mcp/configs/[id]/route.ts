import { NextRequest } from "next/server";
import prisma from "@/lib/database/pirsma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 验证 ID 格式
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Invalid config ID" }, { status: 400 });
    }

    const config = await prisma.mCPConfig.findUnique({ where: { id } });
    if (!config) {
      return Response.json({ error: "MCP config not found" }, { status: 404 });
    }
    return Response.json({ config });
  } catch (err) {
    console.error("Failed to fetch MCP config:", err);
    return Response.json(
      { error: "Failed to fetch MCP config" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 验证 ID 格式
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Invalid config ID" }, { status: 400 });
    }

    const data = await request.json();

    // 验证 URL 格式（如果提供）
    if (data.url !== undefined && (!data.url || typeof data.url !== "string")) {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 检查配置是否存在
    const existingConfig = await prisma.mCPConfig.findUnique({ where: { id } });
    if (!existingConfig) {
      return Response.json({ error: "MCP config not found" }, { status: 404 });
    }

    const config = await prisma.mCPConfig.update({ where: { id }, data });
    return Response.json({ config });
  } catch (err) {
    console.error("Failed to update MCP config:", err);
    return Response.json(
      { error: "Failed to update MCP config" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 验证 ID 格式
    if (!id || typeof id !== "string") {
      return Response.json({ error: "Invalid config ID" }, { status: 400 });
    }

    // 检查配置是否存在
    const existingConfig = await prisma.mCPConfig.findUnique({ where: { id } });
    if (!existingConfig) {
      return Response.json({ error: "MCP config not found" }, { status: 404 });
    }

    await prisma.mCPConfig.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("Failed to delete MCP config:", err);
    return Response.json(
      { error: "Failed to delete MCP config" },
      { status: 500 },
    );
  }
}
