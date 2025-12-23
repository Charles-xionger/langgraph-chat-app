import { NextRequest, NextResponse } from "next/server";
import { OSSClient } from "@/services/ossService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // 生成唯一的文件路径
    const timestamp = Date.now();
    const objectKey = `uploads/${timestamp}-${file.name}`;

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到 OSS
    const ossClient = new OSSClient();
    const result = await ossClient.uploadObject(objectKey, buffer);

    return NextResponse.json({
      success: true,
      url: result.url,
      objectKey,
      size: file.size,
      name: file.name,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
