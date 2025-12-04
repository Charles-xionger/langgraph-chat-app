# 使用 Prisma + PostgreSQL 替换 SQLite（完整教程）

当您的服务需要更高并发或希望使用托管数据库（例如在多实例部署场景下），可以用 PostgreSQL + Prisma 替换 SQLite。下面给出从依赖安装、Prisma schema、数据库初始化、迁移到示例代码的完整步骤。

## 步骤概览

- 安装依赖：`prisma`、`@prisma/client`、`@langchain/langgraph-checkpoint-postgres`（可选：`pg`）
- 初始化 Prisma、配置 `DATABASE_URL`
- 定义并迁移 `Session` 模型（checkpoint 交给 PostgresSaver）
- 创建 Prisma 客户端单例，适配 Next.js 热重载
- 用 PostgresSaver 管理 LangGraph 的 checkpoint
- 在 API 路由与 Server Component 中使用 Prisma（Node.js 运行时）
- 调试与数据管理：Prisma Studio

---

## 1. 安装依赖

```bash
pnpm add prisma @prisma/client @langchain/langgraph-checkpoint-postgres
# 如需手动管理连接池或项目提示缺少驱动，再安装：
# pnpm add pg
npx prisma --version
```

## 2. 启动 PostgreSQL（本地快速测试）

建议使用 Docker 本地启动一个临时 Postgres 实例：

```bash
docker run --name chat-postgres -e POSTGRES_PASSWORD=pass -e POSTGRES_USER=chatuser -e POSTGRES_DB=chat -p 5432:5432 -d postgres:15
```

然后在 `.env` 中配置 `DATABASE_URL`：

```env
DATABASE_URL="postgresql://chatuser:pass@localhost:5432/chat"
```

## 3. 初始化 Prisma

```bash
npx prisma init
```

在 Prisma 7 中，`schema.prisma` 的 datasource 不再写 `url`，连接字符串移动到 `prisma.config.ts`。首先在 `schema.prisma` 中设置 provider 并添加基本模型（仅 Session）：

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model Session {
  id         String   @id @default(cuid())
  title      String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// LangGraph 的 checkpoint 使用 PostgresSaver 管理，无需在 Prisma 中定义对应表
```

说明：LangGraph 的 checkpoint 将由 PostgresSaver 在 PostgreSQL 中自动创建与维护相关表，无需手动在 Prisma schema 中定义。

接着修改 `prisma.config.ts` 配置连接串与迁移目录：

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

## 4. 迁移并生成客户端

```bash
npx prisma migrate dev --name init
npx prisma generate
```

> 生产环境建议使用 `npx prisma migrate deploy` 执行已存在的迁移；开发环境使用 `migrate dev`。

## 5. 在代码中使用 Prisma（示例）

在 `app/agent/db.ts` 或类似模块中引入 `PrismaClient` 并实现基本的 CRUD 与 checkpoint 保存/读取示例：

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// 保存/更新会话元信息
export async function upsertSession(id: string, data: { title: string }) {
  return prisma.session.upsert({
    where: { id },
    update: { title: data.title },
    create: { id, title: data.title },
  });
}

// checkpoint 由 PostgresSaver 管理，无需手写保存/读取逻辑
```

注意：LangGraph 通过 PostgresSaver 提供的 Checkpointer 实现自动管理保存/读取。

---

## 5.1 Next.js 集成要点（App Router）

- 运行时：Prisma 仅支持 Node.js 运行时；不要在 Edge Runtime 中使用。
- 单例化客户端：在开发热重载时复用单一 `PrismaClient`，避免连接爆炸。

示例：在 `lib/prisma.ts` 建立单例（Prisma 7 需传入 adapter）

```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter, log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

在 API 路由使用（指定 Node.js 运行时）：

```ts
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const users = await prisma.session.findMany();
  return NextResponse.json(users);
}
```

在 Server Component 使用：

```tsx
// app/users/page.tsx
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export default async function UsersPage() {
  const sessions = await prisma.session.findMany();
  return (
    <main>
      <h1>Sessions</h1>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>{s.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

---

## 5.2 使用 PostgresSaver 管理 LangGraph Checkpoint

安装并初始化 PostgresSaver：

```ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
// 方式一：使用连接串（无需直接引入 pg）
const checkpointer = await PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);
await checkpointer.setup();
```

或使用连接池（可选）：

```ts
import { Pool } from "pg";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const checkpointer = new PostgresSaver(pool);
await checkpointer.setup();
```

在工作流编译中使用：

```ts
const app = workflow.compile({ checkpointer });
```

---

## 5.3 调试与数据管理

- 打开可视化管理界面：

```bash
npx prisma studio
```

- 校验与格式化：

```bash
npx prisma validate
npx prisma format
```

## 6. 将项目配置改为使用 PostgreSQL

- 把原来使用 `better-sqlite3` 的初始化逻辑替换为对 `prisma` 的调用（移除 `SqliteSaver` 依赖）。
- 确保 `process.env.DATABASE_URL` 已在 `.env` 中配置，且 CI / 生产环境使用托管 Postgres 的连接字符串。

示例：在 `workflow.compile` 或初始化代码处传入 PostgresSaver：

```ts
const app = workflow.compile({ checkpointer });
```

---

## 7. 其他建议

- 性能与连接池：在高并发场景下，确保 Prisma 的连接池配置（Postgres 端）合适，并在服务端复用单一的 `PrismaClient` 实例。
- 迁移数据：若要把现有的 SQLite 数据迁移到 Postgres，可导出 SQLite 中的 `sessions` 与 checkpoint JSON，然后用脚本批量导入到 Postgres（通过 Prisma 或直接 SQL）。
- 备份与运维：生产环境建议使用托管 Postgres（如 AWS RDS / Railway / Supabase 等），并配置定期备份与监控。
- LangGraph 的 checkpoint 管理：推荐使用 `@langchain/langgraph-checkpoint-postgres` 搭配 `pg`，由 PostgresSaver 统一管理到 PostgreSQL；如保留 SQLite，可继续使用 `@langchain/langgraph-checkpoint-sqlite`。

— 若使用 Prisma 7：

- 在 `schema.prisma` 的 datasource 区块仅保留 `provider`，不要写 `url`
- 在 `prisma.config.ts` 写 `datasource.url = env('DATABASE_URL')`
- 在应用代码实例化 `PrismaClient` 时传入适配器（PostgreSQL 使用 `@prisma/adapter-pg`）

---

## 8. 生产部署与依赖调整

- 依赖清理：迁移完成后移除 SQLite 相关依赖与代码路径。

```bash
pnpm remove better-sqlite3 @langchain/langgraph-checkpoint-sqlite
```

- 部署数据库迁移：在 CI/部署时运行：

```bash
npx prisma migrate deploy
```

- 环境变量：在生产平台安全配置 `DATABASE_URL`，避免将连接串写入代码。

---

## 9. 从 SQLite 迁移到 PostgreSQL（示例脚本思路）

如需迁移历史数据，可以编写一个脚本：从 `better-sqlite3` 读取，再用 Prisma 写入 Postgres。

```ts
// pseudo-script.ts
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const db = new Database(process.env.CHAT_DB_PATH || "chat_history.db");

// 读取 sessions 表
const rows = db.prepare("SELECT id, title FROM sessions").all();
for (const r of rows) {
  await prisma.session.upsert({
    where: { id: r.id },
    update: { title: r.title },
    create: { id: r.id, title: r.title },
  });
}

// 读取并写入 checkpoints（按项目实际表结构）
const ckpts = db.prepare("SELECT id, data FROM checkpoints").all();
for (const c of ckpts) {
  await prisma.checkpoint.upsert({
    where: { id: c.id },
    update: { data: JSON.parse(c.data) },
    create: { id: c.id, data: JSON.parse(c.data) },
  });
}
```

脚本仅为思路示例，请按项目实际的 SQLite 表结构调整字段名与序列化逻辑。

如果你希望我把上述示例代码直接合并到 `app/agent/db.ts`（按项目目前代码风格实现），我可以继续为你实现并运行一次本地迁移示例。
