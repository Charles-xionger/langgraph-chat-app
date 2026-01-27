# MCP配置升级指南 - 支持Headers和多服务器

## 改造概览

本次改造实现以下功能：

1. ✅ **支持Headers鉴权** - 可以为MCP服务器配置Authorization等HTTP headers
2. ✅ **支持多个MCP服务器** - 可以同时启用多个MCP配置
3. ✅ **改进的缓存机制** - 支持带headers的缓存key

## 数据库迁移

### 1. 运行Prisma迁移

```bash
cd /Users/jiangxinbo/Desktop/chat-app
pnpm prisma migrate dev --name add_mcp_headers
```

这会：

- 为`MCPConfig`表添加`headers` JSON字段
- 生成迁移SQL文件

### 2. 手动迁移（如果自动迁移失败）

```sql
-- 添加headers字段
ALTER TABLE "MCPConfig" ADD COLUMN "headers" JSONB;
```

## 前端改造指南

### 1. 更新MCPConfigDialog组件

```typescript
// components/mcp/MCPConfigDialog.tsx
const handleSelect = async (id: string | null, checked: boolean) => {
  const { mcpConfigs, addMcpConfig, removeMcpConfig } =
    useModelStore.getState();

  if (checked && id) {
    // 添加配置
    try {
      const response = await fetch(`/api/mcp/configs/${id}`);
      if (response.ok) {
        const data = await response.json();
        const config = data.config;
        addMcpConfig({
          id: config.id,
          url: config.url,
          headers: config.headers || undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching MCP config:", error);
    }
  } else if (id) {
    // 移除配置
    removeMcpConfig(id);
  }
};
```

### 2. 更新config-panel支持多选和headers编辑

在`components/mcp/config-panel.tsx`中：

- 将单选改为复选框（支持多选）
- 添加headers输入字段（JSON格式）
- 显示已选配置列表

### 3. 更新useStreamedMessages

```typescript
// hooks/useStreamedMessages.ts
const { mcpConfigs } = currentConfig || {};

const messageOptions: MessageOptions = {
  ...opts,
  ...(files && files.length > 0 && { files }),
  ...(mcpConfigs && mcpConfigs.length > 0 && { mcpConfigs }),
  // ...
};
```

### 4. 更新ChatPane

```typescript
// components/ChatPane.tsx
const { mcpConfigs } = useModelStore();

const { isSending, isReceiving, sendMessage, cancel, resumeExecution } =
  useStreamedMessages(threadId, {
    provider: selectedProvider || undefined,
    model: selectedModelId,
    autoToolCall,
    enabledTools,
    mcpConfigs, // 传递多个MCP配置
  });
```

## 后端改造指南

### 1. 更新API路由

```typescript
// app/api/agent/stream/route.ts
const mcpConfigsParam = searchParams.get("mcpConfigs");
const mcpConfigs = mcpConfigsParam ? JSON.parse(mcpConfigsParam) : undefined;

// 传递给agent
const iterable = await streamResponse({
  threadId,
  userId,
  userText: userContent,
  opts: {
    // ...
    mcpConfigs,
  },
});
```

### 2. 更新AgentService

```typescript
// services/agentService.ts
const mcpConfigs = opts?.mcpConfigs;

const agent = await createAgent({
  threadId,
  provider,
  model,
  mcpConfigs, // 传递多个配置
  autoToolCall,
  enabledTools,
});
```

### 3. 更新Agent创建逻辑

```typescript
// lib/agent/index.ts
export async function createAgent(config?: AgentConfigOptions) {
  // ...

  // 加载MCP工具（支持多个服务器）
  let mcptools: DynamicTool[] = [];
  if (config?.mcpConfigs && config.mcpConfigs.length > 0) {
    for (const mcpConfig of config.mcpConfigs) {
      try {
        const tools = await loadMCPTools(mcpConfig);
        mcptools.push(...tools);
        console.log(`✅ 加载MCP工具: ${mcpConfig.url} - ${tools.length}个工具`);
      } catch (error) {
        console.error(`❌ 加载MCP工具失败: ${mcpConfig.url}`, error);
      }
    }
  }

  // ...
}
```

## 配置示例

### 带Authorization Header的配置

```json
{
  "name": "bing-cn-mcp-server",
  "url": "https://mcp.api-inference.modelscope.net/381f14ee3da141/mcp",
  "description": "Bing搜索MCP服务",
  "headers": {
    "Authorization": "Bearer ms-47c89b1c-04f5-401e-a89c-68e4e5d931ea"
  },
  "enabled": true
}
```

### 多个MCP服务器配置

```typescript
// Store中存储的配置
mcpConfigs: [
  {
    id: "config-1",
    url: "https://mcp1.example.com/mcp",
    headers: { Authorization: "Bearer token1" },
  },
  {
    id: "config-2",
    url: "https://mcp2.example.com/mcp",
    headers: { "X-API-Key": "key2" },
  },
];
```

## 测试清单

- [ ] 创建带headers的MCP配置
- [ ] 测试Authorization header是否正确传递到MCP服务器
- [ ] 同时启用多个MCP配置
- [ ] 验证MCP工具正确加载
- [ ] 测试工具选择器显示所有MCP工具
- [ ] 验证缓存机制（相同URL但不同headers应分别缓存）
- [ ] 测试旧配置的兼容性（headers为null）

## 注意事项

1. **Headers安全性**: Headers中的token会被存储在数据库和localStorage中，建议：
   - 数据库使用加密存储
   - 生产环境使用环境变量或密钥管理系统
2. **向后兼容**: 旧的没有headers的配置仍然可以正常工作

3. **缓存失效**: 修改headers后需要清除旧缓存或重启服务

4. **多服务器性能**: 启用多个MCP服务器会增加启动时间，建议按需启用

## 常见问题

### Q: 如何清除MCP缓存？

A: 重启Next.js开发服务器即可清除内存缓存

### Q: Headers支持哪些字段？

A: 支持所有标准HTTP headers，常用的包括：

- `Authorization`: Bearer token / API key
- `X-API-Key`: API密钥
- `X-Custom-Header`: 自定义header

### Q: 可以同时使用多少个MCP服务器？

A: 没有硬性限制，但建议不超过5个以保持性能
