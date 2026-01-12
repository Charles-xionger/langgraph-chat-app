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

# 必填：数据库配置
DATABASE_URL="postgresql://postgres:example@localhost:5432/chat_db?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=chat_db

# 可选：其他功能
SERPAPI_API_KEY=xxxx  # 网页搜索功能
NEXT_PUBLIC_DASHSCOPE_API_KEY=sk-xxxx  # 语音输入功能
```

完整配置说明请参考 `.env.local.example` 文件。

### 4. 启动数据库

使用 Docker Compose 快速启动 PostgreSQL：

```bash
docker-compose up -d
```

或手动安装 PostgreSQL 并创建数据库：

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

## 🐛 常见问题

### 1. 数据库连接失败

检查 PostgreSQL 是否运行：

```bash
docker-compose ps
# 或
pg_isready -h localhost -p 5432
```

### 2. MCP 工具加载缓慢

首次加载会从服务器获取工具列表，后续请求会使用缓存。如需清除缓存，重启服务即可。

### 3. 工具调用失败

确保配置了对应的 API Key：

- 网页搜索需要 `SERPAPI_API_KEY`
- 语音识别需要 `NEXT_PUBLIC_DASHSCOPE_API_KEY`

### 4. 模型切换不生效

检查是否配置了对应模型的 API Key，并在 Zustand store 中正确保存了配置。

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
