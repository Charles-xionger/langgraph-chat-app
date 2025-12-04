# 使用 Prisma + PostgreSQL 替换 SQLite

当服务需要更高并发、托管数据库支持或多实例部署时，建议把本地 SQLite 替换为 PostgreSQL，并使用 Prisma 作为 ORM。本文将把你当前项目的 LangGraph / checkpoint 场景与 Prisma 官方 Next.js 指南的要点整合在一起：依赖、schema、迁移、客户端单例、Next.js（App Router）示例页面、seed 与部署建议。

**概览**

- 安装 Prisma 及驱动、初始化并配置 `prisma.config.ts`
- 定义 `schema.prisma`（示例包含 `User`/`Post`）
- 迁移、生成 Client、seed 数据
- 在 Next.js (App Router) 中创建 `lib/prisma.ts` 单例，并在 Server Components / API 路由中使用
- 为 LangGraph 使用 `@langchain/langgraph-checkpoint-postgres` 管理 checkpoint（可与 Prisma 并存）
- 部署注意：Vercel 上需 `prisma generate`（`postinstall`）、避免 Turbopack 问题（特定 Next.js 版本）

---

## 前置条件

- Node.js 20+
- 如果要在远端部署：Vercel 账号（或其他平台）

## 1. 从 Next.js 示例开始（可选）

如果你是从零开始搭建一个 Next.js + Prisma 示例项目，Prisma 的官方示例建议使用 `create-next-app`：

```bash
npx create-next-app@latest nextjs-prisma
cd nextjs-prisma
```

（本项目使用 `pnpm`，下面示例也提供 `pnpm` 命令）

## 2. 安装依赖

推荐安装（开发依赖与运行时依赖）：

```bash
# 使用 pnpm
pnpm add -D prisma tsx @types/pg
pnpm add @prisma/client @prisma/adapter-pg dotenv pg

# 或使用 npm
npm install -D prisma tsx @types/pg
npm install @prisma/client @prisma/adapter-pg dotenv pg
```

说明：如果使用其他数据库（MySQL / SQLite / SQL Server），请安装对应驱动；这里示例使用 PostgreSQL。

## 3. 初始化 Prisma 并指定输出目录（Next.js app 路径示例）

官方 Next.js 指南建议在初始化时把 Prisma Client 的输出放到 `app/generated/prisma`（便于在 App Router 中导入）：

```bash
npx prisma init --db --output ../app/generated/prisma
```

该命令会引导你创建一个托管 Postgres（如果你选择 Data Platform），并生成：`prisma/schema.prisma`、`.env`（包含 `DATABASE_URL`）、`prisma.config.ts` 等。

## 4. 定义 Prisma Schema（示例）

在 `prisma/schema.prisma` 中设置 `generator` 的 `output` 与 `datasource` provider（Prisma 7 的约定：datasource 不内嵌 `url`）：

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  authorId  Int
  author    User    @relation(fields: [authorId], references: [id])
}
```

如果你已有 `Session` 模型用于聊天会话，保留或合并至上面的 schema：

```prisma
model Session {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 5. 配置 `prisma.config.ts`（加载 `.env` 并设置 migrations/seed）

示例 `prisma.config.ts`：

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // 可在此指定 seed 脚本（示例）
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

## 6. 迁移、生成 Client、seed

开发环境运行：

```bash
npx prisma migrate dev --name init
npx prisma generate
```

写好 `prisma/seed.ts` 后可以运行 seed：

```bash
npx prisma db seed
npx prisma studio
```

示例 `prisma/seed.ts`（使用生成的 client）

```ts
import { PrismaClient } from "../app/generated/prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@prisma.io",
      posts: {
        create: [
          {
            title: "Join the Prisma Discord",
            content: "https://pris.ly/discord",
            published: true,
          },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: { name: "Bob", email: "bob@prisma.io" },
  });

  console.log({ alice, bob });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

注意：`prisma.config.ts` 中的 `seed` 字段可设置为上面的命令，这样 `npx prisma db seed` 会运行它。

## 7. 在 Next.js 中创建 Prisma Client 单例（避免热重载重复连接）

在 `lib/prisma.ts` 中创建单例（Prisma 7 与 `@prisma/adapter-pg` 示例）：

```ts
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

declare global {
  // eslint-disable-next-line no-var
  var __prisma?: PrismaClient
}

export const prisma = global.__prisma || new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma

export default prisma
```

该模式在开发时将 Prisma Client 挂到全局，避免 HMR 时反复创建连接。

## 8. 在 App Router 中使用 Prisma（Server Component / API 路由）

示例：在 `app/page.tsx` 中直接查询用户（Server Component）

```tsx
import prisma from "@/lib/prisma";
export const runtime = "nodejs";

export default async function Home() {
  const users = await prisma.user.findMany();
  return (
    <main>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name || u.email}</li>
        ))}
      </ul>
    </main>
  );
}
```

示例 API 路由（`app/api/users/route.ts`）：

```ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}
```

更多页面示例：`app/posts/page.tsx`、`app/posts/[id]/page.tsx`、`app/posts/new/page.tsx`（使用 `next/form` 的 server action）可参考 Prisma 官方 Next.js 指南的实现方式。

## 9. LangGraph checkpoint：`@langchain/langgraph-checkpoint-postgres`

如果你的项目使用 LangGraph 的 checkpoint，推荐使用 `@langchain/langgraph-checkpoint-postgres` 来把 checkpoint 存放在 Postgres：

```ts
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// 方式一：使用连接字符串
const checkpointer = await PostgresSaver.fromConnString(
  process.env.DATABASE_URL!
);
await checkpointer.setup();

// 方式二：传入 pg Pool
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const checkpointer2 = new PostgresSaver(pool);
await checkpointer2.setup();

// 然后在 workflow / app 初始化中传入：
// const app = workflow.compile({ checkpointer })
```

注意：PostgresSaver 会在数据库中按需创建表结构，通常无需把 checkpoint 表写入 `schema.prisma`。如果你要使用 Prisma 操作相同表格，请确认表结构与 Prisma schema 的一致性。

## 10. 部署与 Vercel 注意事项

- 如果你的 `package.json` 的 `dev` 脚本使用 Turbopack（Next.js v15.2.0/v15.2.1 存在已知问题），在这些版本下请移除 `--turbopack` 标志：

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "postinstall": "prisma generate",
  "start": "next start"
}
```

- 在部署（例如 Vercel）时，确保 `prisma generate` 在构建或 `postinstall` 阶段执行，以便 Prisma Client 可被正确打包。
- 在 CI/生产运行迁移时使用：

```bash
npx prisma migrate deploy
```

## 11. 迁移 SQLite 数据到 Postgres（思路）

如果你要从 SQLite（`better-sqlite3`）迁移历史数据到 Postgres：

- 导出 SQLite 的表数据（JSON 或 CSV）。
- 用脚本（Node.js + Prisma）逐条写入 Postgres（`upsert` 可避免重复）。

示例思路（伪代码）：

```ts
import Database from "better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";
const db = new Database("./chat_history.db");
const prisma = new PrismaClient();

const sessions = db.prepare("SELECT id, title, created_at FROM sessions").all();
for (const s of sessions) {
  await prisma.session.upsert({
    where: { id: s.id },
    update: { title: s.title },
    create: { id: s.id, title: s.title },
  });
}
```

## 12. 调试与工具

- 打开 Prisma Studio：`npx prisma studio`
- 格式与校验：`npx prisma format`、`npx prisma validate`
