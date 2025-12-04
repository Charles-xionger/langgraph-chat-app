import { BaseMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import * as dotenv from "dotenv";

// 如果不是测试环境，则加载环境变量
if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

/**
 * 使用环境变量创建一个 PostgresSaver 实例
 * @returns PostgresSaver 实例
 */
export function createPostgresMemory(): PostgresSaver {
  // 构建连接字符串，支持可选的 SSL 模式
  const connectionString = `${process.env.DATABASE_URL}${
    process.env.DB_SSLMODE ? `?sslmode=${process.env.DB_SSLMODE}` : ""
  }`;
  return PostgresSaver.fromConnString(connectionString);
}

/**
 * 获取指定线程的消息历史记录
 * @param threadId - 要获取历史记录的线程 ID
 * @returns 与线程关联的消息数组
 */
export const getHistory = async (threadId: string): Promise<BaseMessage[]> => {
  const history = await postgresCheckpointer.get({
    configurable: { thread_id: threadId },
  });
  return Array.isArray(history?.channel_values?.messages)
    ? history.channel_values.messages
    : [];
};

// 创建一个全局的 PostgresSaver 实例
export const postgresCheckpointer = createPostgresMemory();
