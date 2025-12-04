## Chat Agent — 概览与快速入门

本文档整合了本项目中 Chat Agent 的实现要点、环境与依赖、SQLite 与 LangGraph 的 checkpoint 集成、前后端交互要点，以及常见问题与解决建议。目标是提供一个连贯、按步骤可执行的操作指南，便于本地开发与调试。

**先决条件**

- Node.js（建议 LTS，例如 v20）
- `pnpm`（或其它包管理器）
- macOS 用户推荐安装 Xcode 命令行工具以确保本地编译原生模块

**目录结构提示**

````markdown
## Chat Agent — 概览与快速入门

本文档整合了本项目中 Chat Agent 的实现要点、环境与依赖、SQLite 与 LangGraph 的 checkpoint 集成、前后端交互要点，以及常见问题与解决建议。目标是提供一个连贯、按步骤可执行的操作指南，便于本地开发与调试。

**先决条件**

- Node.js（建议 LTS，例如 v20）
- `pnpm`（或其它包管理器）
- macOS 用户推荐安装 Xcode 命令行工具以确保本地编译原生模块

**目录结构提示**

- 核心实现位于 `app/agent`（例如 `db.ts`、`chatbot.ts`、`graph.ts`）

---

## 安装与配置

1. 安装项目依赖：

```bash
pnpm install
```

2. 安装与本功能相关的依赖：

```bash
pnpm add @langchain/langgraph @langchain/core langchain @langchain/openai zod dotenv better-sqlite3 @langchain/langgraph-checkpoint-sqlite
pnpm i --save-dev @types/better-sqlite3
```

3. 环境变量：复制示例并填写 API Key

```bash
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY（以及可选的 OPENAI_BASE_URL）
```

示例 `.env`：

```env
OPENAI_API_KEY=your_openai_api_key
# OPTIONAL: customize the base url if needed
OPENAI_BASE_URL=your_openai_base_url_optional
CHAT_DB_PATH=chat_history.db # 可选，自定义 DB 路径
```

---

## 快速示例（模型与运行）

示例：初始化环境并创建模型对象

```ts
import dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  temperature: 0,
  modelName: "gpt-3.5-turbo",
});
```

按以上步骤安装依赖并配置 `.env` 后，可以直接运行开发服务器：

```bash
pnpm run dev
```

---

## SQLite 与 LangGraph checkpoint 集成

本项目使用 SQLite（`better-sqlite3`）存储 LangGraph 的 checkpoint，并同时维护一个 `sessions` 表用于会话元信息（便于前端展示）。核心要点：

- `SqliteSaver`（来自 `@langchain/langgraph-checkpoint-sqlite`）负责保存/加载 checkpoint。
- 推荐把 DB 路径通过环境变量 `CHAT_DB_PATH` 配置，默认为 `chat_history.db`。

示例：创建数据库与 checkpointer 并编译 workflow

```ts
import Database from "better-sqlite3";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import path from "path";

const dbPath = path.resolve(
  process.cwd(),
  process.env.CHAT_DB_PATH || "chat_history.db"
);
const db = new Database(dbPath);
const checkpointer = new SqliteSaver(db);
const app = workflow.compile({ checkpointer });

// 首次运行确保初始化
await checkpointer.init();
```

在本项目中，`app/agent/db.ts` 会负责：

- 确保 `sessions` 表存在（例如调用 `initSessionTable()`）
- 提供按 `thread_id` 查询/更新会话元信息的接口

---

## 前端与 API 交互说明

- `POST /api/chat`：发送消息，接收端可以传入可选的 `thread_id`；若未提供，后端会创建并返回一个新的 `thread_id`。
- `GET /api/chat/history?thread_id=...`：前端用于加载某个会话的历史记录，后端从 LangGraph 的 state 中读取并返回格式化的消息数组。

在切换会话时，前端应保存并传回 `thread_id`，以便后端加载对应的 checkpoint 并返回正确的历史上下文。

---

## 初始化与本地调试步骤

1. 安装依赖：

```bash
pnpm install
```

2. 配置环境变量：

```bash
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY 和可选 CHAT_DB_PATH
```

3. 启动开发服务器并确认 DB 文件创建：

```bash
pnpm run dev
# 启动后在项目根目录应出现 chat_history.db（或你在 CHAT_DB_PATH 指定的路径）
```

4. 可选：检查表结构

```bash
sqlite3 chat_history.db ".tables"
sqlite3 chat_history.db "PRAGMA table_info(sessions);"
```

---

## 常见问题与建议

1. better-sqlite3 bindings 错误

- 错误示例：`Could not locate the bindings file`、`NODE_MODULE_VERSION` 或 `ERR_DLOPEN_FAILED`。
- 解决步骤：
  - 确保 Node 版本兼容（建议使用 LTS v20）；使用 `nvm install 20 && nvm use 20` 切换。
  - macOS 上安装 Xcode 命令行工具：

```bash
xcode-select ---install
```

- 清理并重装依赖：

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm rebuild better-sqlite3
```

2. 并发写入与性能

- SQLite 在大量并发写入时受限；若应用会有多个服务实例并发写同一文件，考虑：
  - 把 SQLite 设置为 WAL 模式：

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
```

- 或改用支持并发的数据库（如 Postgres / MySQL）来存储 checkpoint。

3. 会话元信息展示

- 建议在 `sessions` 表维护 `id`（即 `thread_id`）、`name`、`created_at`、`updated_at` 等字段，并在收到消息时更新 `updated_at`，以便前端按活跃时间排序显示会话列表。

更多内容（Prisma + PostgreSQL 替换 SQLite 的完整教程）请参见：`docs/note-prisma.md`。
````
