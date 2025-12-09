# 语音输入功能文档

## 概述

本项目集成了阿里云千问 ASR（Automatic Speech Recognition）实时语音识别功能，支持通过麦克风进行实时语音转文字输入。

## 功能特性

- ✅ 实时语音识别（WebSocket 实时流式传输）
- ✅ 支持 VAD（Voice Activity Detection）自动断句
- ✅ 支持手动模式控制
- ✅ 录音状态可视化反馈
- ✅ 识别结果自动填入输入框
- ✅ 完整的错误处理

## 技术架构

### 核心组件

```
┌─────────────────────┐
│   Composer.tsx      │  用户界面层
│  (语音输入按钮)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   useQwenASR.ts     │  业务逻辑层
│  (语音识别 Hook)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  WebSocket API      │  传输层
│  (阿里云 DashScope)  │
└─────────────────────┘
```

## 使用指南

### 1. 环境配置

在项目根目录的 `.env` 或 `.env.local` 文件中添加以下配置：

```bash
# 阿里云 DashScope API Key
# 获取地址: https://help.aliyun.com/zh/model-studio/get-api-key
NEXT_PUBLIC_DASHSCOPE_API_KEY=sk-your-api-key-here

# （可选）阿里云模型名称
NEXT_PUBLIC_ALIYUN_MODEL_NAME=qwen-turbo
```

**重要提示：**

- 环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端访问
- 修改环境变量后需要重启开发服务器
- 不要将真实的 API Key 提交到版本控制系统

### 2. Hook 使用方法

#### 基础用法

```typescript
import { useQwenASR } from "@/hooks/useQwenASR";

function MyComponent() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isProcessing,
    transcript,
    status,
  } = useQwenASR({
    onTranscript: (text) => {
      console.log("识别结果:", text);
    },
    onError: (error) => {
      console.error("错误:", error);
    },
  });

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? "停止" : "开始"}录音
    </button>
  );
}
```

#### 完整配置

```typescript
const asr = useQwenASR({
  // API Key（默认从环境变量读取）
  apiKey: process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY,

  // 模型名称
  model: "qwen3-asr-flash-realtime",

  // 是否启用服务端 VAD（自动断句）
  enableServerVad: true,

  // WebSocket 基础 URL
  baseUrl: "wss://dashscope.aliyuncs.com/api-ws/v1/realtime",

  // 识别完成回调
  onTranscript: (text: string) => {
    console.log("最终识别结果:", text);
  },

  // 错误回调
  onError: (error: Error) => {
    console.error("ASR 错误:", error.message);
  },

  // 状态变化回调
  onStatusChange: (status) => {
    console.log("当前状态:", status);
  },
});
```

### 3. API 接口

#### 返回值

| 属性             | 类型                  | 说明         |
| ---------------- | --------------------- | ------------ |
| `startRecording` | `() => Promise<void>` | 开始录音     |
| `stopRecording`  | `() => void`          | 停止录音     |
| `reset`          | `() => void`          | 重置状态     |
| `isRecording`    | `boolean`             | 是否正在录音 |
| `isProcessing`   | `boolean`             | 是否正在处理 |
| `transcript`     | `string`              | 当前识别文本 |
| `status`         | `Status`              | 当前状态     |

#### 状态枚举

```typescript
type Status =
  | "idle" // 空闲
  | "connecting" // 连接中
  | "recording" // 录音中
  | "processing" // 处理中
  | "completed"; // 已完成
```

### 4. 在 Composer 中的集成示例

```typescript
import { useQwenASR } from "@/hooks/useQwenASR";

const Composer = () => {
  const [value, setValue] = useState("");

  const { startRecording, stopRecording, isRecording, isProcessing } =
    useQwenASR({
      onTranscript: (text) => {
        // 将识别结果插入到输入框
        setValue((prev) => (prev ? `${prev} ${text}` : text));
      },
      onError: (error) => {
        alert(`语音识别错误: ${error.message}`);
      },
    });

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={handleVoiceClick} disabled={isProcessing}>
        {isRecording ? "停止录音" : "开始录音"}
      </button>
    </div>
  );
};
```

## 技术细节

### WebSocket 通信流程

```
1. 建立连接
   ↓
2. 发送 session.update（配置会话）
   ↓
3. 开始录音，持续发送音频块
   input_audio_buffer.append
   ↓
4. 停止录音
   ├─ VAD 模式: 自动检测静音
   └─ Manual 模式: 发送 commit
   ↓
5. 接收识别结果
   conversation.item.input_audio_transcription.completed
   ↓
6. 关闭连接
```

### 音频格式要求

- **编码格式**: PCM16
- **采样率**: 16kHz
- **声道数**: 单声道（Mono）
- **传输格式**: Base64 编码

### VAD 模式 vs Manual 模式

#### VAD 模式（推荐）

- 服务端自动检测语音活动
- 自动断句，无需手动控制
- 适合连续对话场景

```typescript
{
  enableServerVad: true,
  turn_detection: {
    type: "server_vad",
    threshold: 0.2,          // VAD 阈值
    silence_duration_ms: 800  // 静音持续时间
  }
}
```

#### Manual 模式

- 完全手动控制
- 需要显式调用 `stopRecording()` 并发送 commit
- 适合精确控制场景

```typescript
{
  enableServerVad: false,
  turn_detection: null
}
```

## 浏览器兼容性

### 支持的浏览器

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 14.1+
- ✅ Edge 79+

### 所需权限

- 麦克风访问权限（`navigator.mediaDevices.getUserMedia`）
- WebSocket 连接支持

### 安全要求

- **必须使用 HTTPS**（本地开发可以用 localhost）
- 用户需要明确授权麦克风权限

## 错误处理

### 常见错误及解决方案

| 错误                         | 原因                 | 解决方案                 |
| ---------------------------- | -------------------- | ------------------------ |
| `API Key is required`        | 未配置 API Key       | 检查环境变量配置         |
| `WebSocket connection error` | 网络连接失败         | 检查网络和防火墙设置     |
| `NotAllowedError`            | 用户拒绝麦克风权限   | 引导用户授权麦克风       |
| `NotFoundError`              | 找不到麦克风设备     | 检查硬件设备             |
| `NotReadableError`           | 麦克风被其他应用占用 | 关闭其他使用麦克风的应用 |

### 错误处理示例

```typescript
const asr = useQwenASR({
  onError: (error) => {
    if (error.message.includes("API Key")) {
      alert("请配置阿里云 API Key");
    } else if (error.message.includes("NotAllowedError")) {
      alert("请允许浏览器访问麦克风");
    } else {
      alert(`语音识别错误: ${error.message}`);
    }
  },
});
```

## 性能优化

### 音频数据传输优化

```typescript
// 音频块大小: 3200 字节 ≈ 0.1 秒
const chunkSize = 3200;

// 发送间隔: 100ms
mediaRecorder.start(100);
```

### 内存管理

```typescript
// 清理音频流
if (mediaRecorderRef.current) {
  mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
}

// 关闭 WebSocket 连接
if (wsRef.current) {
  wsRef.current.close(1000, "Recording stopped");
}
```

## 最佳实践

### 1. 用户体验优化

```typescript
// 提供清晰的状态反馈
{
  isRecording && <span>🎙️ 正在录音...</span>;
}
{
  isProcessing && <span>⏳ 正在处理...</span>;
}

// 禁用按钮防止重复操作
<button disabled={isProcessing}>{isRecording ? "停止" : "开始"}</button>;
```

### 2. 错误提示友好化

```typescript
const getErrorMessage = (error: Error) => {
  const messages: Record<string, string> = {
    NotAllowedError: "请允许浏览器访问麦克风",
    NotFoundError: "未检测到麦克风设备",
    NotReadableError: "麦克风被其他应用占用",
  };
  return messages[error.name] || `语音识别错误: ${error.message}`;
};
```

### 3. 性能监控

```typescript
useQwenASR({
  onStatusChange: (status) => {
    console.log(`[${new Date().toISOString()}] Status: ${status}`);
  },
});
```

## 调试技巧

### 启用详细日志

Hook 内部已包含 console.log，可以在浏览器控制台查看：

```
[ASR] WebSocket connected
[ASR] Session update sent
[ASR] Received: {...}
[ASR] Audio committed
```

### 测试麦克风权限

```typescript
async function testMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    console.log("麦克风测试成功");
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    console.error("麦克风测试失败:", err);
  }
}
```

## 相关资源

- [阿里云 DashScope 文档](https://help.aliyun.com/zh/model-studio/)
- [获取 API Key](https://help.aliyun.com/zh/model-studio/get-api-key)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## FAQ

### Q: 为什么需要 HTTPS？

A: 浏览器出于安全考虑，只允许在 HTTPS 环境下访问麦克风（localhost 除外）。

### Q: 支持离线使用吗？

A: 不支持。本功能依赖阿里云 WebSocket API 进行实时识别。

### Q: 可以识别哪些语言？

A: 当前配置为中文识别，可以通过修改 `language` 参数支持其他语言。

### Q: 识别准确率如何？

A: 准确率取决于：

- 录音环境（噪音程度）
- 说话清晰度
- 使用的模型版本

### Q: 如何处理长时间录音？

A: VAD 模式会自动断句。Manual 模式建议控制在 60 秒以内。

### Q: 收费标准是什么？

A: 请参考[阿里云 DashScope 计费说明](https://help.aliyun.com/zh/model-studio/product-overview/billing)。

## 更新日志

### v1.0.0 (2025-12-09)

- ✨ 初始版本
- ✅ 支持实时语音识别
- ✅ 支持 VAD 和 Manual 模式
- ✅ 完整的状态管理
- ✅ 错误处理机制

## 贡献指南

如需改进或扩展功能，请参考以下文件：

- Hook 实现: `/hooks/useQwenASR.ts`
- UI 集成: `/components/Composer.tsx`
- 类型定义: 在 Hook 文件中

## 许可证

MIT License
