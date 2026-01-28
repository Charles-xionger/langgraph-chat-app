/**
 * 基础应用错误类
 * 所有自定义错误都应继承此类
 */
export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly timestamp: string;
  public readonly errorId: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    Error.captureStackTrace(this);
  }
}

/**
 * 验证错误 (400)
 * 用于请求参数验证失败
 */
export class ValidationError extends AppError {
  public readonly fields?: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.fields = fields;
  }
}

/**
 * 认证错误 (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

/**
 * 授权错误 (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

/**
 * 资源未找到错误 (404)
 */
export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string, resource?: string) {
    super(message, 404, "NOT_FOUND");
    this.resource = resource;
  }
}

/**
 * 业务逻辑错误 (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, errorCode = "BUSINESS_LOGIC_ERROR") {
    super(message, 422, errorCode);
  }
}

/**
 * 数据库错误 (500)
 */
export class DatabaseError extends AppError {
  public readonly prismaCode?: string;
  public readonly meta?: Record<string, unknown>;

  constructor(
    message: string,
    prismaCode?: string,
    meta?: Record<string, unknown>,
  ) {
    super(message, 500, "DATABASE_ERROR", false);
    this.prismaCode = prismaCode;
    this.meta = meta;
  }
}

/**
 * Agent/LangGraph 相关错误 (500)
 */
export class AgentError extends AppError {
  public readonly agentContext?: {
    threadId?: string;
    provider?: string;
    model?: string;
  };

  constructor(message: string, agentContext?: AgentError["agentContext"]) {
    super(message, 500, "AGENT_ERROR", false);
    this.agentContext = agentContext;
  }
}

/**
 * MCP 服务错误 (502)
 */
export class MCPError extends AppError {
  public readonly mcpUrl?: string;
  public readonly toolName?: string;

  constructor(message: string, mcpUrl?: string, toolName?: string) {
    super(message, 502, "MCP_ERROR", false);
    this.mcpUrl = mcpUrl;
    this.toolName = toolName;
  }
}

/**
 * 外部服务错误 (502/503)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    service: string,
    statusCode: 502 | 503 = 502,
    originalError?: unknown,
  ) {
    super(message, statusCode, "EXTERNAL_SERVICE_ERROR", false);
    this.service = service;
    this.originalError = originalError;
  }
}

/**
 * 文件上传错误 (400/413/500)
 */
export class FileUploadError extends AppError {
  public readonly fileName?: string;
  public readonly fileSize?: number;

  constructor(
    message: string,
    statusCode: 400 | 413 | 500 = 400,
    fileName?: string,
    fileSize?: number,
  ) {
    super(message, statusCode, "FILE_UPLOAD_ERROR");
    this.fileName = fileName;
    this.fileSize = fileSize;
  }
}

/**
 * 速率限制错误 (429)
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.retryAfter = retryAfter;
  }
}
