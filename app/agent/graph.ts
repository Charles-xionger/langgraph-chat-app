import dotenv from "dotenv";
dotenv.config();
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import Database from "better-sqlite3";

import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import path from "path";
import { initSessionTable } from "./db";
const modle = new ChatOpenAI({
  model: process.env.OPENAI_MODEL_NAME || "gpt-3.5-turbo",
  temperature: 0,
});

async function chatbotNode(state: typeof MessagesAnnotation.State) {
  const response = await modle.invoke(state.messages);
  return {
    messages: [response],
  };
}

// 构建图
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatbotNode)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

// 检查点

export type AppType = ReturnType<typeof workflow.compile>;

let checkpointer: SqliteSaver;
let app: AppType;

const dbPath = path.resolve(process.cwd(), "chat_history.db");
console.log("🚀 ~ dbPath:", dbPath);
function initCheckpointer() {
  if (!checkpointer) {
    try {
      // 使用 better-sqlite3 创建数据库连接
      const db = new Database(dbPath);
      // 初始化自定义 session 表
      initSessionTable();
      checkpointer = new SqliteSaver(db);
      console.log("SQLite checkpointer initialized successfully.");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  return checkpointer;
}

export const getCheckpointer = () => {
  return initCheckpointer();
};

export async function initializeApp() {
  initCheckpointer();
  if (!app) {
    app = workflow.compile({ checkpointer });
  }
  return app;
}

// 获取应用实例的函数

export const getApp = async () => {
  if (!app) {
    app = await initializeApp();
  }
  return app;
};
