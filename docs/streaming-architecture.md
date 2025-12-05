# 流式数据传输方案文档

## 概述

本项目采用了 **Server-Sent Events (SSE)** 技术实现 AI Agent 的流式响应，通过 Next.js API Routes、LangGraph Agent 和 React Hooks 构建了一套完整的实时对话系统。

## 架构设计

### 整体流程图

```
用户输入
  ↓
MessageInput (React 组件)
  ↓
useStreamedMessages Hook
  ↓
chatService.createMessageStream()
  ↓
GET/POST /api/agent/stream
  ↓
agentService.streamResponse()
  ↓
LangGraph Agent (LangChain)
  ↓
SSE 流式返回
  ↓
前端实时更新 UI
```

## 核心组件

### 1. API 层 - Stream Route

**文件**: `app/api/agent/stream/route.ts`

#### 功能特性

- 支持 GET 和 POST 两种请求方式
- 使用 Server-Sent Events (SSE) 协议
- 60 秒超时限制 (`maxDuration = 60`)
- 强制动态渲染 (`dynamic = "force-dynamic"`)

#### GET 请求处理

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const userContent = searchParams.get("content");

  // 创建可读流
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // 初始化连接
      controller.enqueue(encoder.encode(`: connected\n\n`));

      // 处理 Agent 流式响应
      const iterable = await streamResponse({...});

      for await (const chunk of iterable) {
        // 发送数据块
        send(chunk);
      }

      // 发送完成信号
      controller.enqueue(encoder.encode("event: done\n"));
    },

    cancel() {
      // 客户端断开时清理
      isAborted = true;
    }
  });
}
```

#### 响应头配置

```typescript
{
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no"  // 关闭 Nginx 缓冲
}
```

### 2. 服务层 - Agent Service

**文件**: `services/agentService.ts`

#### 核心功能

1. **流式响应生成器** (`streamResponse`)

   - 接收用户输入和 threadId
   - 调用 LangGraph Agent
   - 转换流式数据为标准格式

2. **数据转换处理**

   ```typescript
   async function* generator(): AsyncGenerator<MessageResponse, void, unknown> {
     // 工具调用累积器
     const toolCallAccumulators = new Map();

     // 内容缓冲区（处理不完整代码块）
     let contentBuffer = "";
     let lastSentIndex = 0;

     for await (const chunk of inerable) {
       // 处理 AI 消息
       // 处理工具调用
       // 处理内容块
     }
   }
   ```

3. **代码块完整性检测**

   ````typescript
   function findSafeBreakPoint(text: string): number {
     // 检测 Markdown 代码块是否闭合
     const codeBlockPattern = /```/g;
     let count = 0;

     // 统计代码块标记数量
     while ((match = codeBlockPattern.exec(text)) !== null) {
       count++;
     }

     // 奇数表示未闭合
     if (count % 2 === 1) {
       return lastIndex; // 在最后一个 ``` 处截断
     }

     return text.length;
   }
   ````

#### 消息类型处理

| 消息类型           | 处理方式   | 说明               |
| ------------------ | ---------- | ------------------ |
| `AIMessageChunk`   | 累积内容   | AI 生成的文本内容  |
| `ToolMessage`      | 直接追加   | 工具执行结果       |
| `tool_call_chunks` | 累积后发送 | 工具调用参数片段   |
| `tool_calls`       | 完整发送   | 完整的工具调用请求 |

### 3. 前端 Hooks - useStreamedMessages

**文件**: `hooks/useStreamedMessages.ts`

#### 状态管理

```typescript
const [isSending, setIsSending] = useState(false); // 正在发送
const [isReceiving, setIsReceiving] = useState(false); // 正在接收
const [sendError, setSendError] = useState<Error | null>(null);

const streamRef = useRef<EventSource | null>(null);
const currentMessageRef = useRef<MessageResponse | null>(null);
```

#### 流式接收处理

```typescript
const handleStreamResponse = useCallback(
  async (streamParams) => {
    // 创建 EventSource 连接
    const stream = await createMessageStream(tid, text, opts);

    stream.onmessage = (event: MessageEvent) => {
      const messageResponse = JSON.parse(event.data);

      // 工具消息直接追加
      if (messageResponse.type === "tool") {
        queryClient.setQueryData(["messages", tid], (old) => [
          ...old,
          messageResponse,
        ]);
        return;
      }

      // AI 消息累积更新
      if (
        !currentMessageRef.current ||
        currentMessageRef.current.data.id !== data.id
      ) {
        // 新消息
        currentMessageRef.current = messageResponse;
        queryClient.setQueryData(["messages", tid], (old) => [
          ...old,
          currentMessageRef.current,
        ]);
      } else {
        // 累积现有消息
        const newContent = currentData.content + data.content;
        const newToolCalls = hasToolCalls
          ? data.tool_calls
          : currentData.tool_calls;

        currentMessageRef.current = {
          ...currentMessageRef.current,
          data: {
            ...currentData,
            content: newContent,
            tool_calls: newToolCalls,
          },
        };

        // 更新缓存中的消息
        queryClient.setQueryData(["messages", tid], (old) => {
          const idx = old.findIndex(
            (m) => m.data?.id === currentMessageRef.current!.data.id
          );
          const clone = [...old];
          clone[idx] = currentMessageRef.current!;
          return clone;
        });
      }
    };

    stream.addEventListener("done", () => {
      // 清理流
      cleanupStream();
    });

    stream.addEventListener("error", (ev) => {
      // 错误处理
    });
  },
  [queryClient]
);
```

### 4. Agent 构建器 - AgentBuilder

**文件**: `lib/agent/builder.ts`

#### LangGraph 状态图构建

```typescript
build() {
  const stateGraph = new StateGraph(MessagesAnnotation)
    // 核心节点
    .addNode("chatbot", this.callModel.bind(this))
    .addNode("tools", this.toolNode)

    // 起始 → chatbot
    .addEdge(START, "chatbot")

    // chatbot 的条件路由
    .addConditionalEdges("chatbot", this.shouldContinue.bind(this), {
      tools: "tools",
      [END]: END,
    })

    // 工具执行后返回 chatbot
    .addEdge("tools", "chatbot");

  return stateGraph.compile({
    checkpointer: this.checkpointer,
  });
}
```

#### 工具调用决策

```typescript
shouldContinue(state) {
  const lastMessage = state.messages.at(-1);

  // 包含 tool_calls 则执行工具
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // 检查是否需要补充信息
  const needsMoreInfo = ["i need more information", "let me search for"]
    .some(phrase => content.includes(phrase));

  if (needsMoreInfo) {
    return "tools";
  }

  return END;
}
```

## 数据流详解

### 消息格式定义

**文件**: `types/message.ts`

```typescript
export interface MessageResponse {
  type: "human" | "ai" | "tool" | "error";
  data: BasicMessageData | AIMessageData | ToolMessageData;
}

export interface AIMessageData {
  id: string;
  content: string | ContentItem[];
  tool_calls?: ToolCall[];
  tool_call_chunks?: ToolCallChunk[];
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
}

export interface ToolMessageData {
  id: string;
  content: string;
  status: string;
  tool_call_id: string;
  name: string;
}
```

### SSE 事件格式

#### 数据事件

```
data: {"type":"ai","data":{"id":"msg-123","content":"Hello"}}

```

#### 完成事件

```
event: done
data: {}

```

#### 错误事件

```
event: error
data: {"message":"Error message","threadId":"thread-123"}

```

## 关键技术特性

### 1. 增量式内容更新

- **问题**: 流式传输的内容片段需要正确组装
- **解决**: 使用 `currentMessageRef` 缓存当前消息，累积更新内容
- **优势**: 避免重复渲染，提升性能

### 2. 代码块完整性保证

- **问题**: Markdown 代码块可能在传输中被截断
- **解决**: 检测 ``` 标记数量，仅在偶数时发送（代码块已闭合）
- **优势**: 避免前端渲染错误

### 3. 工具调用流式累积

```typescript
// 工具调用片段累积
const toolCallAccumulators = new Map<
  number,
  {
    id: string;
    name: string;
    args: string;
  }
>();

for (const tchunk of toolCallChunks) {
  const { index, id, name, args } = tchunk;
  const idx = index ?? 0;

  if (!toolCallAccumulators.has(idx)) {
    toolCallAccumulators.set(idx, {
      id: id || "",
      name: name || "",
      args: args || "",
    });
  } else {
    const acc = toolCallAccumulators.get(idx)!;
    if (id) acc.id = id;
    if (name) acc.name += name;
    acc.args += args || "";
  }
}
```

### 4. 连接管理与清理

```typescript
// 自动清理机制
useEffect(() => {
  return () => {
    cleanupStream();
  };
}, [cleanupStream]);

const cleanupStream = useCallback(() => {
  try {
    if (streamRef.current) {
      streamRef.current.close();
    }
  } finally {
    streamRef.current = null;
    currentMessageRef.current = null;
    setIsSending(false);
    setIsReceiving(false);
  }
}, []);
```

## 错误处理

### API 层

```typescript
try {
  const iterable = await streamResponse({...});
  // 处理流式数据
} catch (error) {
  controller.enqueue(encoder.encode("event: error\n"));
  controller.enqueue(encoder.encode(
    `data: ${JSON.stringify({
      message: error instanceof Error ? error.message : "Unknown error",
      threadId,
    })}\n\n`
  ));
}
```

### 前端层

```typescript
stream.addEventListener("error", (ev) => {
  const errorMsg: MessageResponse = {
    type: "error",
    data: {
      id: `err-${Date.now()}`,
      content: `⚠️ ${message}`,
    },
  };

  queryClient.setQueryData(["messages", tid], (old) => [...old, errorMsg]);

  cleanupStream();
});
```

## 性能优化

### 1. React Query 缓存管理

```typescript
queryClient.setQueryData(["messages", tid], (old) => {
  const idx = old.findIndex((m) => m.data?.id === messageId);
  if (idx === -1) return old;

  const clone = [...old];
  clone[idx] = updatedMessage;
  return clone;
});
```

### 2. 内容缓冲策略

- 文本内容使用缓冲区 (`contentBuffer`)
- 仅在安全断点处发送内容
- 减少不必要的网络传输

### 3. 工具消息分离处理

- 工具调用结果直接追加（不累积）
- AI 文本内容累积更新
- 避免混淆和重复渲染

## 使用示例

### 发送消息

```typescript
const { sendMessage, isSending, isReceiving } = useStreamedMessages(threadId);

// 发送用户消息
await sendMessage("请帮我查询天气", {
  provider: "openai",
  model: "gpt-4.1",
});
```

### 手动处理流式响应

```typescript
const { handleStreamResponse } = useStreamedMessages(threadId);

await handleStreamResponse({
  threadId: "thread-123",
  text: "用户输入",
  opts: { model: "gpt-4.1" },
});
```

### 取消流式传输

```typescript
const { cancel } = useStreamedMessages(threadId);

// 用户取消请求
cancel();
```

## 配置说明

### 环境变量

```env
NEXT_PUBLIC_API_BASE_URL=/api/agent
```

### API 超时设置

```typescript
// app/api/agent/stream/route.ts
export const maxDuration = 60; // 60秒超时
```

### Stream Mode 配置

```typescript
const inerable = await agent.stream(inputs, {
  streamMode: "messages", // 流式获取消息 token
  // streamMode: "updates", // 流式获取状态更新
  configurable: { thread_id: threadId },
});
```

## 最佳实践

1. **始终清理资源**: 组件卸载时关闭 EventSource 连接
2. **错误边界处理**: 捕获并展示流式传输错误
3. **状态同步**: 使用 React Query 管理服务器状态
4. **渐进式增强**: 支持降级到非流式请求
5. **连接重试**: 网络异常时自动重连（可扩展）

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **状态管理**: TanStack React Query
- **AI 框架**: LangChain + LangGraph
- **流式协议**: Server-Sent Events (SSE)
- **类型系统**: TypeScript
- **数据库**: PostgreSQL (Prisma)

## 扩展性

### 未来优化方向

1. **断点续传**: 支持流式传输中断后恢复
2. **压缩传输**: 启用 gzip 压缩减少带宽
3. **多租户隔离**: 基于 threadId 的资源隔离
4. **速率限制**: 防止滥用 API
5. **WebSocket 支持**: 双向通信能力

### 多模型支持

```typescript
// 扩展配置项
interface MessageOptions {
  provider?: string; // "openai" | "anthropic" | "azure"
  model?: string; // 具体模型名称
  tools?: string[]; // 启用的工具列表
  allowTool?: "allow" | "deny";
  approveAllTools?: boolean;
}
```

## 调试技巧

### 1. 查看流式数据

```typescript
// 在 agentService.ts 中
for await (const chunk of inerable) {
  console.log("🚀 ~ generator ~ chunk:", chunk);
}
```

### 2. 监控连接状态

```typescript
// 在 useStreamedMessages.ts 中
console.log("Stream state:", {
  isSending,
  isReceiving,
  hasStream: !!streamRef.current,
});
```

### 3. 验证数据完整性

```typescript
// 检查代码块闭合
const safeBreakPoint = findSafeBreakPoint(contentBuffer);
console.log(
  "Buffer length:",
  contentBuffer.length,
  "Safe point:",
  safeBreakPoint
);
```

## 总结

本项目的流式数据传输方案通过以下设计实现了高效、可靠的实时对话体验：

1. **分层架构**: API → Service → Hook 清晰分离关注点
2. **增量更新**: 流式累积内容，减少重复渲染
3. **智能缓冲**: 保证代码块完整性，优化传输效率
4. **工具集成**: 支持 LangGraph 工具调用流程
5. **错误恢复**: 完善的错误处理和连接清理机制

通过 SSE 技术与 LangGraph 的深度整合，实现了类似 ChatGPT 的流畅对话体验。
