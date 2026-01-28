import { NextRequest, NextResponse } from "next/server";
import { OSSClient } from "@/services/ossService";
import {
  ValidationError,
  FileUploadError,
  withErrorHandler,
} from "@/lib/errors";

// 文件限制配置
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "text/plain",
  "text/csv",
  "application/json",
];

export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw new ValidationError("No file provided", {
      file: ["file is required"],
    });
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new FileUploadError(
      `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      413,
      file.name,
      file.size,
    );
  }

  // 验证文件类型
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new FileUploadError(
      `File type ${file.type} is not allowed`,
      400,
      file.name,
    );
  }

  // 验证文件名（防止路径遍历攻击）
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  // 生成唯一的文件路径
  const timestamp = Date.now();
  const objectKey = `uploads/${timestamp}-${sanitizedFileName}`;

  // 将 File 转换为 Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 上传文件到 OSS
  const ossClient = new OSSClient();
  const result = await ossClient.uploadObject(objectKey, buffer);

  return NextResponse.json({
    success: true,
    data: {
      url: result.url,
      objectKey,
      size: file.size,
      name: sanitizedFileName,
      type: file.type,
    },
  });
});
