import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  handleApiError,
  handlePrismaError,
  formatStreamError,
  withErrorHandler,
} from "@/lib/errors/handler";
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  AgentError,
} from "@/lib/errors/types";
import { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";

describe("Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleApiError", () => {
    it("should handle ValidationError correctly", async () => {
      const error = new ValidationError("Invalid input", {
        email: ["Email is required"],
      });

      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe("Invalid input");
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.fields).toEqual({ email: ["Email is required"] });
    });

    it("should handle NotFoundError correctly", async () => {
      const error = new NotFoundError("Thread not found", "Thread");

      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
      expect(data.error.details).toEqual({ resource: "Thread" });
    });

    it("should handle AgentError with context", async () => {
      const error = new AgentError("Agent failed", {
        threadId: "thread-123",
        provider: "openai",
      });

      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.details).toEqual({
        threadId: "thread-123",
        provider: "openai",
      });
    });

    it("should handle unknown errors as internal errors", async () => {
      const error = new Error("Unexpected error");

      const response = handleApiError(error);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it("should not include stack trace in production", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const error = new ValidationError("Test error");
      const response = handleApiError(error);
      const data = await response.json();

      expect(data.error.stack).toBeUndefined();

      vi.unstubAllEnvs();
    });
  });

  describe("handlePrismaError", () => {
    it("should handle P2025 (record not found) error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
          meta: { modelName: "Thread" },
        },
      );

      const appError = handlePrismaError(prismaError);

      expect(appError).toBeInstanceOf(NotFoundError);
      expect(appError.message).toContain("not found");
    });

    it("should handle P2002 (unique constraint) error", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        },
      );

      const appError = handlePrismaError(prismaError);

      expect(appError).toBeInstanceOf(ValidationError);
      expect((appError as ValidationError).fields).toHaveProperty("email");
    });

    it("should handle unknown Prisma errors as DatabaseError", () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Database error",
        {
          code: "P9999",
          clientVersion: "5.0.0",
        },
      );

      const appError = handlePrismaError(prismaError);

      expect(appError).toBeInstanceOf(DatabaseError);
      expect(appError.statusCode).toBe(500);
    });
  });

  describe("formatStreamError", () => {
    it("should format AppError for streaming", () => {
      const error = new ValidationError("Invalid input");
      const formatted = formatStreamError(error, "thread-123");
      const parsed = JSON.parse(formatted);

      expect(parsed.message).toBe("Invalid input");
      expect(parsed.code).toBe("VALIDATION_ERROR");
      expect(parsed.threadId).toBe("thread-123");
      expect(parsed.errorId).toBeDefined();
    });

    it("should format unknown error for streaming", () => {
      const error = new Error("Unknown error");
      const formatted = formatStreamError(error);
      const parsed = JSON.parse(formatted);

      expect(parsed.code).toBe("STREAM_ERROR");
      expect(parsed.errorId).toBeDefined();
    });

    it("should not include sensitive info in production", () => {
      vi.stubEnv("NODE_ENV", "production");

      const error = new Error("Database connection failed: password=secret");
      const formatted = formatStreamError(error);
      const parsed = JSON.parse(formatted);

      expect(parsed.message).toBe("Stream processing failed");
      expect(parsed.stack).toBeUndefined();

      vi.unstubAllEnvs();
    });
  });

  describe("withErrorHandler", () => {
    it("should catch and handle errors in async handlers", async () => {
      const handler = withErrorHandler(async (): Promise<NextResponse> => {
        throw new ValidationError("Test error");
      });

      const response = await handler();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should pass through successful responses", async () => {
      const successResponse = NextResponse.json({ success: true });
      const handler = withErrorHandler(
        async (): Promise<NextResponse> => successResponse,
      );

      const response = await handler();

      expect(response).toBe(successResponse);
    });

    it("should preserve handler arguments", async () => {
      const handler = withErrorHandler(async (arg1: string, arg2: number) => {
        expect(arg1).toBe("test");
        expect(arg2).toBe(42);
        return NextResponse.json({ arg1, arg2 });
      });

      await handler("test", 42);
    });
  });
});
