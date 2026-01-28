# 🌾 Stardew Valley AI Assistant

一个基于 Next.js + LangGraph 构建的智能对话助手，采用 Stardew Valley（星露谷物语）主题设计，支持多模型、工具调用、MCP 协议集成和语音输入。

## ✨ 主要特性

- 🤖 **多模型支持**：OpenAI、Aliyun Qwen、Google Gemini
- 🔧 **工具调用系统**：内置天气查询、计算器、网页搜索等工具，支持审批流程
- 🔌 **MCP 协议集成**：支持 Model Context Protocol，可接入外部工具服务器
- 🎙️ **语音输入**：集成阿里云语音识别（ASR）
- 📁 **文件上传**：支持图片、文档等多模态输入
- 💾 **持久化对话**：基于 PostgreSQL + LangGraph Checkpoint
- 🎨 **主题切换**：深色/浅色模式，代码高亮主题可选
- 📱 **响应式设计**：适配移动端和桌面端

## 🏗️ 技术栈

### 前端

- **Next.js 16** - React 框架
- **TypeScript** - 类型安全
- **TanStack Query** - 数据获取和状态管理
- **Zustand** - 轻量级状态管理
- **Tailwind CSS** - 样式框架
- **Radix UI** - 无障碍 UI 组件

### 后端

- **LangChain** - LLM 应用框架
- **LangGraph** - 状态图执行引擎
- **Prisma** - 数据库 ORM
- **PostgreSQL** - 数据库

### AI 集成

- **OpenAI GPT-4** - 主力模型
- **Aliyun Qwen** - 国内模型支持
- **Google Gemini** - 多模态能力
- **@langchain/mcp-adapters** - MCP 协议支持

## 📋 前置要求

- Node.js 18+
- pnpm 8+ (推荐) 或 npm/yarn
- PostgreSQL 14+
- 至少一个 LLM API Key (OpenAI/Aliyun/Gemini)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd chat-app
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制示例配置文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：

```env
# 必填：至少配置一个 LLM
OPENAI_API_KEY=sk-xxxx
# 或
ALIYUN_API_KEY=sk-xxxx
# 或
GOOGLE_API_KEY=AIzaSyAxxxx

# 必填：数据库配置（需与 docker-compose.yml 一致）
DATABASE_URL="postgresql://postgres:chat_db_password_2024@localhost:5432/chat_db?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=chat_db_password_2024
POSTGRES_DB=chat_db

# 可选：其他功能
SERPAPI_API_KEY=xxxx  # 网页搜索功能
NEXT_PUBLIC_DASHSCOPE_API_KEY=sk-xxxx  # 语音输入功能
```

完整配置说明请参考 `.env.example` 文件。

### 4. 配置数据库

**选项 A：使用 Docker Compose（本地开发推荐）**

```bash
docker-compose up -d
```

PostgreSQL 容器会自动创建 `chat_db` 数据库，无需手动操作。

**选项 B：使用 Supabase（生产环境推荐）**

1. 在 [Supabase](https://supabase.com/) 创建项目
2. 获取连接字符串：Dashboard -> Settings -> Database -> Connection String (URI)
3. 选择 "Direct Connection" 并复制连接字符串
4. **重要**：如果密码包含特殊字符，需要 URL 编码：

```bash
# 特殊字符编码对照表
@ -> %40
# -> %23
% -> %25
& -> %26
: -> %3A
/ -> %2F
? -> %3F
```

5. 更新 `.env` 文件中的 `DATABASE_URL`：

```env
# 示例（密码已编码）
DATABASE_URL="postgresql://postgres:your%40encoded%23password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

**选项 C：手动安装 PostgreSQL**

如果使用本地 PostgreSQL，需要手动创建数据库：

```sql
CREATE DATABASE chat_db;
```

### 5. 运行数据库迁移

```bash
pnpm prisma migrate dev
```

### 6. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用！

## 📁 项目结构

```
chat-app/
├── app/                      # Next.js App Router
│   ├── api/                 # API 路由
│   │   ├── agent/          # Agent 相关 API
│   │   ├── mcp/            # MCP 配置 API
│   │   └── upload/         # 文件上传 API
│   ├── thread/[id]/        # 对话页面
│   └── page.tsx            # 首页
├── components/              # React 组件
│   ├── ChatPane.tsx        # 主聊天界面
│   ├── MessageList.tsx     # 消息列表
│   ├── Composer.tsx        # 消息输入框
│   ├── mcp/                # MCP 配置组件
│   └── ui/                 # UI 组件库
├── lib/                     # 核心库
│   ├── agent/              # LangGraph Agent
│   │   ├── builder.ts      # Agent 构建器
│   │   ├── tools.ts        # 工具定义
│   │   ├── memory.ts       # 内存管理
│   │   └── index.ts        # Agent 入口
│   └── database/           # 数据库配置
├── hooks/                   # React Hooks
├── stores/                  # Zustand 状态管理
├── services/                # 业务逻辑服务
├── types/                   # TypeScript 类型定义
├── prisma/                  # Prisma 配置和迁移
└── docs/                    # 项目文档

```

## 🔧 核心功能说明

### 工具调用系统

项目内置多种工具，支持审批流程：

- **网页搜索**：使用 SerpAPI 搜索互联网
- **天气查询**：获取实时天气信息
- **计算器**：执行数学计算
- **自定义工具**：通过 MCP 协议扩展

工具调用流程：

1. AI 判断需要调用工具
2. 系统弹出审批界面
3. 用户批准/拒绝
4. 执行工具并返回结果
5. AI 基于结果生成回复

### MCP 协议集成

支持接入外部 MCP (Model Context Protocol) 工具服务器：

1. 在设置中添加 MCP 配置
2. 输入 MCP 服务器 URL
3. 系统自动加载工具列表
4. 工具会被缓存以提升性能

### 多模态支持

- **图片输入**：支持上传图片进行分析（需要 Gemini 或 GPT-4V）
- **文档处理**：可以上传 PDF、Word 等文档
- **语音输入**：集成阿里云 ASR，支持实时语音转文字

### 对话持久化

- 所有对话自动保存到 PostgreSQL
- 使用 LangGraph Checkpoint 机制
- 支持跨会话的上下文记忆
- 工具调用状态可恢复

## 🎨 自定义主题

项目采用 Stardew Valley 风格设计，支持：

- 深色/浅色模式切换
- 代码高亮主题选择（14+ 主题）
- 像素风格字体和图标
- 自定义颜色配置（见 `globals.css`）

## 📚 相关文档

项目文档位于 `docs/` 目录：

- `mcp-feature-summary.md` - MCP 功能总结
- `streaming-architecture.md` - 流式响应架构
- `theme-system-guide.md` - 主题系统指南
- `voice-input-guide.md` - 语音输入使用指南
- `stardew-valley-design-system.md` - 设计系统文档

## 🚀 生产环境部署

### Vercel 部署

项目已配置支持 Vercel 流式响应。部署步骤：

1. **连接 Git 仓库**

   - 在 Vercel Dashboard 导入项目
   - 授权访问 GitHub/GitLab 仓库

2. **配置环境变量**

   - 在 Vercel 项目设置中添加所有必要的环境变量
   - 特别注意：`DATABASE_URL` 使用 Supabase 连接字符串
   - 密码中的特殊字符必须 URL 编码（参考上文数据库配置）

3. **部署配置**

   - Build Command: `pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **数据库迁移**
   - 首次部署后，在 Vercel 项目设置中添加 Build Command：
   ```bash
   pnpm prisma migrate deploy && pnpm run build
   ```

### 重要配置说明

**next.config.ts 已包含以下关键配置：**

```typescript
experimental: {
  serverComponentsExternalPackages: [
    "@langchain/core",
    "@langchain/langgraph",
    // ... 其他包
  ],
}
```

这个配置确保：

- ✅ LangChain/LangGraph 在 Vercel Edge Runtime 正常工作
- ✅ 流式响应不被缓冲，实时返回给前端
- ✅ Prisma Client 正确初始化

**流式响应 headers（已在 route.ts 中配置）：**

```typescript
headers: {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no", // 关键：禁用 Nginx 缓冲
}
```

### 故障排查：流式响应不工作

如果在生产环境遇到前端一直 thinking、刷新后才看到消息的问题：

1. **检查 next.config.ts**

   - 确认 `experimental.serverComponentsExternalPackages` 包含所有 LangChain 包

2. **检查环境变量**

   ```bash
   # 在 Vercel 中验证环境变量
   DATABASE_URL=postgresql://...
   OPENAI_API_KEY=sk-...
   # 等等
   ```

3. **检查 Vercel 函数日志**

   - 在 Vercel Dashboard -> Deployments -> Functions 查看日志
   - 确认后端有生成响应数据

4. **强制重新部署**

   ```bash
   # 推送一个空 commit 触发重新部署
   git commit --allow-empty -m "Redeploy"
   git push
   ```

5. **检查 Vercel 函数超时设置**
   - 免费版限制 10s，Pro 版本默认 60s
   - 确保 `maxDuration = 60` 在 route.ts 中已设置

### 其他平台部署

**Docker 部署：**

项目支持 Docker 容器化部署。创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm prisma generate
RUN pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm start"]
```

构建并运行：

```bash
docker build -t chat-app .
docker run -p 3000:3000 --env-file .env chat-app
```

## 🐛 常见问题

### 1. 数据库连接失败 - "invalid port number"

**错误**：`P1013: The provided database string is invalid. invalid port number in database URL`

**原因**：Supabase 连接字符串中的密码包含特殊字符未编码。

**解决方案**：

1. 找到你的 Supabase 密码（Dashboard -> Settings -> Database -> Database Password -> Reset）
2. 使用在线工具或命令行编码密码：

```bash
# 使用 Node.js 编码
node -e "console.log(encodeURIComponent('your-password'))"

# 或使用 Python
python3 -c "import urllib.parse; print(urllib.parse.quote('your-password', safe=''))"
```

3. 将编码后的密码替换到连接字符串中：

```env
# 原密码: MyP@ss#123
# 编码后: MyP%40ss%23123
DATABASE_URL="postgresql://postgres:MyP%40ss%23123@db.xxxxx.supabase.co:5432/postgres"
```

### 2. Docker 数据库连接失败

检查 PostgreSQL 是否运行：

```bash
docker-compose ps
# 或
pg_isready -h localhost -p 5432
```

### 3. MCP 工具加载缓慢

首次加载会从服务器获取工具列表，后续请求会使用缓存。如需清除缓存，重启服务即可。

### 4. 工具调用失败

确保配置了对应的 API Key：

- 网页搜索需要 `SERPAPI_API_KEY`
- 语音识别需要 `NEXT_PUBLIC_DASHSCOPE_API_KEY`

### 5. 模型切换不生效

检查是否配置了对应模型的 API Key，并在 Zustand store 中正确保存了配置。

### 6. 工具调用 interrupt 触发多次

**问题**：本地环境工具审批只触发一次，但生产环境触发多次。

**原因**：LangGraph 的 `__interrupt__` 可能包含多个元素，或者由于缓冲导致重复处理。

**解决方案**：已在 `agentService.ts` 中优化，只处理第一个 interrupt 并立即停止流。如果仍有问题：

1. 检查前端是否有重复的事件监听器
2. 确认 `vercel.json` 中的 `X-Accel-Buffering: no` 配置生效
3. 查看浏览器 Network 面板，确认只有一个 SSE 连接

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [LangChain](https://www.langchain.com/) - LLM 应用框架
- [LangGraph](https://github.com/langchain-ai/langgraph) - 状态图引擎
- [Stardew Valley](https://www.stardewvalley.net/) - 设计灵感来源
- [Vercel](https://vercel.com/) - 部署平台

---

Made with 💚 by the Stardew Valley Community
