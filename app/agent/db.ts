import path from "path";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

// 支持通过环境变量自定义数据库文件路径（相对于项目根目录）
const dbFile = process.env.CHAT_DB_PATH || "chat_history.db";
const dbPath = path.resolve(process.cwd(), dbFile);
const db = new Database(dbPath);

// 初始化 sessions 表
export function initSessionTable() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
  ).run();
}

export function createSession(name: string) {
  const id = randomUUID();
  db.prepare("INSERT INTO sessions (id, name) VALUES (?, ?)").run(id, name);
  return { id, name };
}

export function getAllSessions() {
  return db
    .prepare(
      "SELECT id, name, created_at FROM sessions ORDER BY created_at DESC"
    )
    .all();
}

export function updateSessionName(id: string, name: string) {
  db.prepare("UPDATE sessions SET name = ? WHERE id = ?").run(name, id);
}

export function deleteSession(id: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export default db;

// 在模块加载时确保 sessions 表存在
initSessionTable();
