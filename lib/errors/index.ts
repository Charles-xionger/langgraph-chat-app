/**
 * 错误处理模块统一导出
 */

// 错误类型
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  BusinessLogicError,
  DatabaseError,
  AgentError,
  MCPError,
  ExternalServiceError,
  FileUploadError,
  RateLimitError,
} from "./types";

// 错误处理函数
export {
  handleApiError,
  handlePrismaError,
  formatStreamError,
  withErrorHandler,
  type ErrorResponse,
} from "./handler";
