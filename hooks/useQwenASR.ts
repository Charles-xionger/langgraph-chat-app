/**
 * Qwen-ASR Realtime WebSocket Hook
 * 用于浏览器端的实时语音识别
 */

import { useState, useRef, useCallback } from "react";

interface UseQwenASROptions {
  apiKey?: string;
  model?: string;
  enableServerVad?: boolean;
  baseUrl?: string;
  onTranscript?: (text: string) => void;
  onRealtimeTranscript?: (confirmedText: string, pendingText: string) => void; // 修改：传递已确认和待确认文本
  onError?: (error: Error) => void;
  onStatusChange?: (
    status: "idle" | "connecting" | "recording" | "processing" | "completed"
  ) => void;
}

interface ASRStatus {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  status: "idle" | "connecting" | "recording" | "processing" | "completed";
}

const defaultBaseUrl = "wss://dashscope.aliyuncs.com/api-ws/v1/realtime";

// 国际
const internationalBaseUrl =
  "wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime";
export function useQwenASR(options: UseQwenASROptions = {}) {
  const {
    apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || "",
    model = "qwen3-asr-flash-realtime",
    enableServerVad = true,
    baseUrl = defaultBaseUrl,
    onTranscript,
    onRealtimeTranscript,
    onError,
    onStatusChange,
  } = options;

  // 调试：打印环境变量状态
  console.log("[ASR Init] Environment check:");
  console.log(
    "  - API Key from env:",
    process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY ? "存在" : "不存在"
  );
  console.log("  - API Key final:", apiKey ? "已配置" : "未配置");
  console.log("  - API Key length:", apiKey?.length || 0);

  const [status, setStatus] = useState<ASRStatus>({
    isRecording: false,
    isProcessing: false,
    transcript: "",
    status: "idle",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRunningRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 更新状态
  const updateStatus = useCallback(
    (newStatus: Partial<ASRStatus>) => {
      setStatus((prev) => {
        const updated = { ...prev, ...newStatus };
        if (newStatus.status && onStatusChange) {
          onStatusChange(newStatus.status);
        }
        return updated;
      });
    },
    [onStatusChange]
  );

  // 发送会话更新
  const sendSessionUpdate = useCallback(
    (ws: WebSocket) => {
      const event = {
        event_id: `session_${Date.now()}`,
        type: "session.update",
        session: {
          modalities: ["text"],
          input_audio_format: "pcm",
          sample_rate: 16000,
          input_audio_transcription: {
            language: "zh",
          },
          turn_detection: enableServerVad
            ? {
                type: "server_vad",
                threshold: 0.3,
                silence_duration_ms: 2000,
              }
            : null,
        },
      };

      ws.send(JSON.stringify(event));
      console.log("[ASR] Session update sent");
    },
    [enableServerVad]
  );

  // 发送音频数据
  const sendAudioChunk = useCallback(
    (ws: WebSocket, audioData: ArrayBuffer) => {
      if (!isRunningRef.current || ws.readyState !== WebSocket.OPEN) {
        return;
      }

      // 转换为 Int16Array (PCM16)
      const pcmData = new Int16Array(audioData);

      // 转换为 base64
      const uint8Array = new Uint8Array(pcmData.buffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      const appendEvent = {
        event_id: `audio_${Date.now()}`,
        type: "input_audio_buffer.append",
        audio: base64,
      };

      ws.send(JSON.stringify(appendEvent));
      console.log(`[ASR] Sent audio chunk: ${pcmData.length} samples`);
    },
    []
  );

  // 提交音频（Manual 模式）
  const commitAudio = useCallback(
    (ws: WebSocket) => {
      if (!enableServerVad && ws.readyState === WebSocket.OPEN) {
        const commitEvent = {
          event_id: `commit_${Date.now()}`,
          type: "input_audio_buffer.commit",
        };
        ws.send(JSON.stringify(commitEvent));
        console.log("[ASR] Audio committed");
      }
    },
    [enableServerVad]
  );

  // 停止录音的内部逻辑
  const stopRecordingInternal = useCallback(() => {
    isRunningRef.current = false;

    // 清除静音定时器
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // 停止 Audio Processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // 关闭 AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // 停止 MediaRecorder（如果有）
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    // 关闭 WebSocket 连接
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Manual 模式需要发送 commit
      if (!enableServerVad) {
        commitAudio(wsRef.current);
      }
      wsRef.current.close(1000, "Recording stopped");
    }
    wsRef.current = null;

    // 更新状态为 idle，不显示 processing
    updateStatus({
      isRecording: false,
      isProcessing: false,
      status: "idle",
    });

    audioChunksRef.current = [];
  }, [commitAudio, updateStatus, enableServerVad]);

  // 处理 WebSocket 消息
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[ASR] Received:", data);

        // 实时转写中间结果（text 类型）
        if (data.type === "conversation.item.input_audio_transcription.text") {
          // text: 已确认的文本（累积的）
          // stash: 待确认的文本（可能会变化）
          const confirmedText = data.text || "";
          const pendingText = data.stash || "";

          console.log("[ASR] Text (confirmed):", confirmedText);
          console.log("[ASR] Stash (pending):", pendingText);

          // 清除静音定时器（用户继续说话）
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
            console.log("[ASR] User continued speaking, cancelled auto-stop");
          }

          // 立即调用实时回调，分别传递已确认和待确认文本
          if (onRealtimeTranscript) {
            onRealtimeTranscript(confirmedText, pendingText);
          }

          // 更新内部状态（用于显示完整文本）
          const fullText = (confirmedText + pendingText).trim();
          updateStatus({
            transcript: fullText,
          });
        }
        // 旧格式兼容：delta 类型
        else if (
          data.type === "conversation.item.input_audio_transcription.delta"
        ) {
          const deltaText = data.delta || "";
          console.log("[ASR] Delta text:", deltaText);

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          if (onRealtimeTranscript) {
            onRealtimeTranscript(deltaText, "");
          }

          updateStatus({
            transcript: deltaText,
          });
        }
        // 最终识别结果（completed）
        else if (
          data.type === "conversation.item.input_audio_transcription.completed"
        ) {
          const transcript = data.transcript || "";
          console.log("[ASR] Final transcript:", transcript);

          updateStatus({
            transcript,
            isProcessing: false,
            status: "completed",
          });

          // 调用最终回调
          if (onTranscript) {
            onTranscript(transcript);
          }

          // VAD 模式下，检测到静音后延迟 5 秒再自动停止
          // 这样用户如果继续说话，可以取消自动停止
          if (enableServerVad) {
            console.log("[ASR] Silence detected, will auto-stop in 5s...");

            // 清除之前的定时器
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            // 设置延迟停止
            silenceTimerRef.current = setTimeout(() => {
              console.log("[ASR] Auto-stopping after silence timeout");
              stopRecordingInternal();
            }, 5000);
          }
        }
      } catch (err) {
        console.error("[ASR] Failed to parse message:", err);
      }
    },
    [
      onTranscript,
      onRealtimeTranscript,
      updateStatus,
      enableServerVad,
      stopRecordingInternal,
    ]
  );

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!apiKey) {
      const error = new Error("API Key is required");
      onError?.(error);
      return;
    }

    try {
      updateStatus({ status: "connecting" });

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      // 创建 WebSocket 连接，在 URL 中传递 API Key
      // 阿里云 DashScope 使用 X-DashScope-Api-Key 参数认证
      const url = `${baseUrl}?model=${model}&api_key=${apiKey}`;
      console.log("[ASR] Connecting to:", baseUrl);

      const ws = new WebSocket(url);
      wsRef.current = ws;
      isRunningRef.current = true;

      ws.onopen = () => {
        console.log("[ASR] WebSocket connected");
        console.log("[ASR] API Key configured:", apiKey ? "Yes" : "No");
        sendSessionUpdate(ws);
        updateStatus({
          isRecording: true,
          status: "recording",
        });
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error("[ASR] WebSocket error:", error);
        console.error("[ASR] Connection URL:", baseUrl);
        console.error("[ASR] Model:", model);
        console.error("[ASR] API Key exists:", !!apiKey);
        console.error("[ASR] API Key length:", apiKey?.length || 0);
        const err = new Error("WebSocket connection error");
        onError?.(err);
        stopRecordingInternal();
      };

      ws.onclose = (event) => {
        console.log("[ASR] WebSocket closed:", event.code, event.reason);
        isRunningRef.current = false;
      };

      // 使用 Web Audio API 处理音频
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // 使用 ScriptProcessorNode 处理音频（虽然已废弃，但兼容性好）
      // bufferSize: 4096, inputChannels: 1, outputChannels: 1
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isRunningRef.current || ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // 转换为 PCM16 (Int16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // 将 Float32 [-1, 1] 转换为 Int16 [-32768, 32767]
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // 发送 PCM 数据
        sendAudioChunk(ws, pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log("[ASR] Audio processing started with Web Audio API");
    } catch (err) {
      console.error("[ASR] Failed to start recording:", err);
      const error =
        err instanceof Error ? err : new Error("Failed to start recording");
      onError?.(error);
      updateStatus({
        status: "idle",
        isRecording: false,
      });
    }
  }, [
    apiKey,
    baseUrl,
    model,
    sendSessionUpdate,
    handleMessage,
    sendAudioChunk,
    updateStatus,
    onError,
    stopRecordingInternal,
  ]);

  // 停止录音（外部接口）
  const stopRecording = useCallback(() => {
    stopRecordingInternal();
  }, [stopRecordingInternal]);

  // 重置状态
  const reset = useCallback(() => {
    stopRecording();
    updateStatus({
      isRecording: false,
      isProcessing: false,
      transcript: "",
      status: "idle",
    });
  }, [stopRecording, updateStatus]);

  return {
    startRecording,
    stopRecording,
    reset,
    ...status,
  };
}
