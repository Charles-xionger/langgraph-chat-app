import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  AgentError,
  MCPError,
  ExternalServiceError,
  FileUploadError,
  RateLimitError,
} from "@/lib/errors/types";

describe("Error Types", () => {
  describe("ValidationError", () => {
    it("should create a validation error with correct properties", () => {
      const error = new ValidationError("Invalid input", {
        email: ["Email is required"],
        password: ["Password must be at least 8 characters"],
      });

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe("VALIDATION_ERROR");
      expect(error.isOperational).toBe(true);
      expect(error.fields).toEqual({
        email: ["Email is required"],
        password: ["Password must be at least 8 characters"],
      });
      expect(error.errorId).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(error.timestamp).toBeDefined();
    });

    it("should work without fields parameter", () => {
      const error = new ValidationError("Invalid input");

      expect(error.fields).toBeUndefined();
    });
  });

  describe("NotFoundError", () => {
    it("should create a not found error with resource", () => {
      const error = new NotFoundError("Thread not found", "Thread");

      expect(error.statusCode).toBe(404);
      expect(error.errorCode).toBe("NOT_FOUND");
      expect(error.resource).toBe("Thread");
    });
  });

  describe("DatabaseError", () => {
    it("should create a database error with Prisma code", () => {
      const error = new DatabaseError("Database operation failed", "P2025", {
        modelName: "Thread",
      });

      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe("DATABASE_ERROR");
      expect(error.isOperational).toBe(false);
      expect(error.prismaCode).toBe("P2025");
      expect(error.meta).toEqual({ modelName: "Thread" });
    });
  });

  describe("AgentError", () => {
    it("should create an agent error with context", () => {
      const error = new AgentError("Agent initialization failed", {
        threadId: "thread-123",
        provider: "openai",
        model: "gpt-4",
      });

      expect(error.statusCode).toBe(500);
      expect(error.errorCode).toBe("AGENT_ERROR");
      expect(error.isOperational).toBe(false);
      expect(error.agentContext).toEqual({
        threadId: "thread-123",
        provider: "openai",
        model: "gpt-4",
      });
    });
  });

  describe("MCPError", () => {
    it("should create an MCP error with URL and tool name", () => {
      const error = new MCPError(
        "MCP tool loading failed",
        "http://localhost:3000",
        "calculator",
      );

      expect(error.statusCode).toBe(502);
      expect(error.errorCode).toBe("MCP_ERROR");
      expect(error.mcpUrl).toBe("http://localhost:3000");
      expect(error.toolName).toBe("calculator");
    });
  });

  describe("ExternalServiceError", () => {
    it("should create an external service error", () => {
      const originalError = new Error("Connection timeout");
      const error = new ExternalServiceError(
        "External service unavailable",
        "File Storage",
        503,
        originalError,
      );

      expect(error.statusCode).toBe(503);
      expect(error.errorCode).toBe("EXTERNAL_SERVICE_ERROR");
      expect(error.service).toBe("File Storage");
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("FileUploadError", () => {
    it("should create a file upload error with file details", () => {
      const error = new FileUploadError(
        "File too large",
        413,
        "large-file.pdf",
        100 * 1024 * 1024,
      );

      expect(error.statusCode).toBe(413);
      expect(error.errorCode).toBe("FILE_UPLOAD_ERROR");
      expect(error.fileName).toBe("large-file.pdf");
      expect(error.fileSize).toBe(100 * 1024 * 1024);
    });
  });

  describe("RateLimitError", () => {
    it("should create a rate limit error with retry after", () => {
      const error = new RateLimitError("Too many requests", 60);

      expect(error.statusCode).toBe(429);
      expect(error.errorCode).toBe("RATE_LIMIT_ERROR");
      expect(error.retryAfter).toBe(60);
    });
  });

  describe("Error ID generation", () => {
    it("should generate unique error IDs", () => {
      const error1 = new ValidationError("Error 1");
      const error2 = new ValidationError("Error 2");

      expect(error1.errorId).not.toBe(error2.errorId);
    });
  });

  describe("Error timestamp", () => {
    it("should include a valid ISO timestamp", () => {
      const error = new ValidationError("Test error");
      const timestamp = new Date(error.timestamp);

      expect(timestamp.toISOString()).toBe(error.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
