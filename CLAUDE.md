# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `pnpm dev` - Start development server (localhost:3000)
- `pnpm build` - Build for production (includes migrate deploy and prisma generate)
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database
- `pnpm prisma migrate dev` - Create and apply new migration (development)
- `pnpm prisma migrate deploy` - Apply existing migrations (production)
- `pnpm prisma generate` - Generate Prisma Client
- `docker-compose up -d` - Start PostgreSQL locally

### Testing
- `pnpm test` - Run all tests with coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:unit` - Run unit tests only
- `pnpm test:integration` - Run integration tests only

## Project Architecture

This is a Next.js 16 chat application built with LangChain/LangGraph for AI agent capabilities, styled with a Stardew Valley theme.

### Core Technology Stack
- **Frontend**: Next.js 16, React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS, Radix UI
- **Backend**: LangChain, LangGraph, Prisma ORM
- **Database**: PostgreSQL with LangGraph Checkpoint for conversation state persistence
- **LLM Support**: OpenAI GPT-4, Aliyun Qwen, Google Gemini (multimodal)
- **External Tools**: MCP (Model Context Protocol) integration

### Streaming Response Architecture

The app uses Server-Sent Events (SSE) for streaming AI responses:

1. **Frontend** (`hooks/useStreamedMessages.ts`): Creates `EventSource` connection, handles incoming chunks
2. **API Route** (`app/api/agent/stream/route.ts`): Creates `ReadableStream` with SSE format, handles GET/POST requests
3. **Service Layer** (`services/agentService.ts`): Calls LangGraph agent with `streamMode: ["updates", "messages"]`
4. **LangGraph Agent** (`lib/agent/builder.ts`): Returns chunks in dual modes:
   - `messages` mode: Streaming AI text content incrementally
   - `updates` mode: State updates, tool calls, and interrupts

**Critical Stream Headers** (must be set in API routes):
```typescript
"Content-Type": "text/event-stream; charset=utf-8"
"Cache-Control": "no-cache, no-transform"
"Connection": "keep-alive"
"X-Accel-Buffering": "no"  // Prevents Nginx buffering
```

**next.config.ts** must include:
```typescript
serverExternalPackages: [
  "@langchain/core", "@langchain/langgraph", "@langchain/openai",
  "@langchain/community", "@langchain/google-genai", "@langchain/mcp-adapters",
  "@prisma/client", "pg"
]
```

### Agent Architecture (LangGraph)

**AgentBuilder** (`lib/agent/builder.ts`) creates stateful LangGraph agents with two modes:

1. **Auto-execution** (`build()`): Tools execute automatically
2. **Approval-required** (`buildWithApproval()`): Tools trigger interrupts for user approval

**Graph Flow**:
- `START` → `chatbot` (LLM with tools bound)
- `chatbot` → conditional check for tool_calls
  - If no tools: `END`
  - If tools: `approval` (or directly to `tools` in auto mode)
- `approval` → `interrupt` (waits for user response via `Command`)
  - User approves: `tools` node
  - User rejects: back to `chatbot` with ToolMessage
- `tools` → `chatbot` (LLM gets tool results)

**Interrupt Handling** (`lib/agent/builder.ts:83-154`):
- Uses LangGraph's `interrupt()` to pause execution
- Returns structured data with question, options, metadata
- Resumed via POST with `Command({ resume: value })`

### Tool System

**Internal Tools** (`lib/agent/tools.ts`):
- `get_weather` - Mock weather data
- `calculator` - Math expressions
- `search_web` - SerpAPI web search
- `web_browser` - Full page content scraping

**MCP Tools** (`lib/agent/index.ts:29-128`):
- Loaded via `@langchain/mcp-adapters` from external MCP servers
- Cached globally with deduplication to avoid repeated loads
- Support tool filtering by ID patterns: `internal:*`, `mcp:*`, `mcp:prefix_*`

**Tool Filtering** (`lib/agent/index.ts:232-262`):
- Enabled tools passed via `enabledTools` array (e.g., `["internal:get_weather", "mcp:oss_file_list"]`)
- Supports wildcards: `internal:*`, `mcp:*`, `mcp:prefix_*`

### Message Flow

1. User sends message via `Composer.tsx`
2. Frontend calls `useStreamedMessages.sendMessage()`
3. `chatService.createMessageStream()` creates SSE connection
4. API calls `agentService.streamResponse()`
5. Agent processes and yields chunks as `MessageResponse`:
   - `type: "ai"` - AI text/tool_calls
   - `type: "tool"` - Tool execution results
   - `type: "interrupt"` - Approval request (pauses stream)
6. Frontend updates React Query cache: `queryClient.setQueryData(["messages", threadId], ...)`
7. On interrupt, user clicks approve/deny via `InterruptDisplay.tsx`
8. Resume via POST with `allowTool: "allow" | "deny"`

### State Management

- **React Query** (`@tanstack/react-query`): Message history, thread list
  - Query keys: `["messages", threadId]`, `["threads"]`
- **Zustand** (`stores/`): App-wide settings
  - `modelStore.ts`: Selected model, provider, autoToolCall
  - `toolStore.ts`: Tool selection state

### Multi-modal Support

File attachments handled in `services/agentService.ts:106-239`:
- **Images**: `image_url` type (base64 or URL)
- **PDF**: `file` type with base64 data
- **Audio/Video**: `audio`/`video` type
- Content follows LangChain's multi-modal message format

### Database Schema

Uses Prisma with PostgreSQL. Key tables:
- `Thread`: Conversation threads with title, timestamps
- LangGraph checkpoint tables (auto-created) store conversation state

### MCP Integration

MCP configuration stored via `app/api/mcp/configs/*`:
- Users can add MCP server URLs
- Tools auto-discovered and cached
- `MultiServerMCPClient` instances cached globally

## Environment Variables

Required minimum configuration:
- **LLM**: `OPENAI_API_KEY` OR `ALIYUN_API_KEY` OR `GOOGLE_API_KEY`
- **Database**: `DATABASE_URL` (PostgreSQL connection string)

Optional features:
- `SERPAPI_API_KEY` - Web search
- `NEXT_PUBLIC_DASHSCOPE_API_KEY` - Voice input (ASR)
- `OSS_*` - Aliyun object storage for file uploads
- `DEFAULT_MCP_URL` - Default MCP server

## Important Implementation Notes

### No Agent Caching
Agent instances are created fresh per request (`lib/agent/index.ts:310-323`) to avoid state pollution in Vercel serverless environment. MCP clients are the only global cache.

### Interrupt Handling
Interrupts pause the stream and require user action. The interrupt message (`type: "interrupt"`) is added to the message list. After user action, `resumeExecution()` removes the interrupt message before continuing.

### Stream Timeout
Default stream timeout is 120s (`app/api/agent/stream/route.ts:11`). Adjust `maxDuration` for Vercel deployment limits.

### Tool Approval Flow
When `autoToolCall: false` (default), tools trigger interrupts. User approves/deny via `InterruptDisplay.tsx`, which calls `resumeExecution(allowTool)`.

## Deployment Considerations

### Vercel
- Build command: `pnpm prisma migrate deploy && pnpm prisma generate && pnpm build`
- Set `DATABASE_URL` with URL-encoded password if using Supabase
- Verify `serverExternalPackages` in `next.config.ts`
- Max function duration: 120s

### Supabase Password Encoding
Special characters in password must be URL-encoded:
```
@ -> %40, # -> %23, % -> %25, & -> %26, : -> %3A
```

### Streaming Issues
If frontend shows "thinking" indefinitely until refresh:
1. Check `serverExternalPackages` includes all LangChain packages
2. Verify `"X-Accel-Buffering: no"` in response headers
3. Check Vercel function logs for actual response generation
4. Verify `maxDuration` setting (default 120s)
