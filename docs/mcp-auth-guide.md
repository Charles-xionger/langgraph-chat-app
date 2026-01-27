# MCP 配置鉴权指南

## 概述

MCP (Model Context Protocol) 配置现在支持自定义 HTTP Headers，用于 API 鉴权和其他请求头配置。

## 功能说明

在添加或编辑 MCP 配置时，您可以在"鉴权 Headers (JSON)"字段中添加自定义的 HTTP Headers。

### 字段说明

- **名称** (必填): MCP 服务的名称，例如 "Drawing Server"
- **URL** (必填): MCP 服务的 SSE 端点地址，例如 "http://localhost:3001/sse"
- **描述** (可选): 对该 MCP 服务的简短描述
- **鉴权 Headers (JSON)** (可选): 用于 API 鉴权的 HTTP Headers，必须是有效的 JSON 格式

## 使用示例

### 1. Bearer Token 鉴权

```json
{
  "Authorization": "Bearer your_access_token_here"
}
```

### 2. API Key 鉴权

```json
{
  "X-API-Key": "your_api_key_here"
}
```

### 3. 多个 Headers

```json
{
  "Authorization": "Bearer your_token",
  "X-Custom-Header": "custom_value",
  "Content-Type": "application/json"
}
```

### 4. Basic 鉴权

```json
{
  "Authorization": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
}
```

## 注意事项

1. **JSON 格式**: Headers 必须是有效的 JSON 对象格式
2. **对象类型**: Headers 必须是键值对对象，不能是数组或其他类型
3. **空值处理**: 如果不需要鉴权，可以留空该字段
4. **安全性**: 请妥善保管您的访问令牌和 API 密钥

## 数据存储

Headers 数据会以 JSON 格式存储在数据库的 `headers` 字段中（`Json` 类型），并在每次请求 MCP 服务时自动附加到 HTTP 请求头中。

## 常见错误

### "Headers 格式错误：必须是有效的 JSON 格式"

这表示您输入的内容不是有效的 JSON。请检查：

- 是否使用了双引号（`"`）而不是单引号（`'`）
- 是否缺少逗号或有多余的逗号
- 是否正确使用了花括号 `{}`

**错误示例：**

```json
{
  "Authorization": "Bearer token", // ❌ 使用了单引号
  "X-API-Key": "key"
}
```

**正确示例：**

```json
{
  "Authorization": "Bearer token", // ✅ 使用双引号
  "X-API-Key": "key"
}
```

### "Headers 必须是一个对象"

Headers 必须是一个对象（键值对），不能是数组或其他类型。

**错误示例：**

```json
["Authorization", "Bearer token"] // ❌ 是数组
```

**正确示例：**

```json
{
  "Authorization": "Bearer token" // ✅ 是对象
}
```

## 前端实现

表单中的 Headers 字段：

- 使用 `<textarea>` 以便输入多行 JSON
- 实时验证 JSON 格式
- 保存时自动解析并验证
- 支持格式化显示（2 空格缩进）

## API 变更

### POST /api/mcp/configs

新增 `headers` 字段（可选）

```typescript
{
  "name": "Drawing Server",
  "url": "http://localhost:3001/sse",
  "description": "AI 绘图服务",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "enabled": true
}
```

### PATCH /api/mcp/configs/:id

支持更新 `headers` 字段

```typescript
{
  "headers": {
    "Authorization": "Bearer new_token"
  }
}
```
