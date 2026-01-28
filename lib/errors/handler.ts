import { NextResponse } from "next/server";
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "./types";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * 标准化错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    errorId: string;
    timestamp: string;
    fields?: Record<string, string[]>;
    details?: Record<string, unknown>;
    stack?: string; // 仅开发环境
  };
}

/**
 * 判断是否为 Prisma 错误
 */
function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

/**
 * 将 Prisma 错误转换为 AppError
 */
export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): AppError {
  switch (error.code) {
    case "P2000":
      return new ValidationError(
        "The provided value is too long for the column",
        {
          [error.meta?.column_name as string]: ["Value too long"],
        },
      );
    case "P2001":
      return new NotFoundError(
        `Record not found: ${error.meta?.cause || "Unknown"}`,
        error.meta?.modelName as string,
      );
    case "P2002":
      return new ValidationError(
        `Unique constraint failed on: ${error.meta?.target}`,
        { [error.meta?.target as string]: ["Must be unique"] },
      );
    case "P2003":
      return new ValidationError("Foreign key constraint failed", {
        foreignKey: ["Invalid reference"],
      });
    case "P2025":
      return new NotFoundError(
        "Record to update or delete not found",
        error.meta?.modelName as string,
      );
    default:
      return new DatabaseError(
        "Database operation failed",
        error.code,
        error.meta,
      );
  }
}

/**
 * 统一错误处理函数 - 用于 API 路由
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === "development";

  // 处理已知的 AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.errorCode,
        statusCode: error.statusCode,
        errorId: error.errorId,
        timestamp: error.timestamp,
        ...(error.isOperational && isDevelopment && { stack: error.stack }),
      },
    };

    // 添加特定错误类型的额外字段
    if ("fields" in error && error.fields) {
      response.error.fields = error.fields as Record<string, string[]>;
    }
    if ("resource" in error && error.resource) {
      response.error.details = { resource: error.resource };
    }
    if ("agentContext" in error && error.agentContext) {
      response.error.details = error.agentContext as Record<string, unknown>;
    }
    if ("mcpUrl" in error && error.mcpUrl) {
      response.error.details = {
        mcpUrl: error.mcpUrl,
        ...("toolName" in error && error.toolName
          ? { toolName: error.toolName }
          : {}),
      };
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // 处理 Prisma 错误
  if (isPrismaError(error)) {
    const appError = handlePrismaError(error);
    return handleApiError(appError);
  }

  // 处理未知错误
  console.error("Unhandled error:", error);

  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const response: ErrorResponse = {
    success: false,
    error: {
      message: isDevelopment
        ? error instanceof Error
          ? error.message
          : "An unexpected error occurred"
        : "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
      errorId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && error instanceof Error && { stack: error.stack }),
    },
  };

  return NextResponse.json(response, { status: 500 });
}

/**
 * 流式错误处理 - 用于 SSE
 */
export function formatStreamError(error: unknown, threadId?: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof AppError) {
    return JSON.stringify({
      message: error.message,
      code: error.errorCode,
      errorId: error.errorId,
      threadId,
      ...(isDevelopment && { stack: error.stack }),
    });
  }

  return JSON.stringify({
    message:
      isDevelopment && error instanceof Error
        ? error.message
        : "Stream processing failed",
    code: "STREAM_ERROR",
    errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId,
  });
}

/**
 * 包装异步处理器以自动捕获错误
 */
export function withErrorHandler<
  T extends (...args: any[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
