"use client";
import { useEffect, useState } from "react";
import { useMessages } from "./hooks/useMessages";

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { messages, input, setInput, loading, handleSendMessage } = useMessages(
    currentSessionId || undefined
  );
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 获取所有会话
  const fetchSessions = async () => {
    const res = await fetch("/api/chat/sessions", { method: "GET" });
    const data = await res.json();
    setSessions(data.sessions || []);
  };

  // 新建会话
  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;
    const res = await fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: sessionName }),
    });
    const data = await res.json();
    setCurrentSessionId(data.session.id);
    setSessionName("");
    fetchSessions();
  };

  // 切换会话
  const handleSwitchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* 侧边栏 - 会话列表 */}
      <div
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-300 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden`}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-gray-100 mb-4">聊天应用</h1>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateSession()}
              placeholder="新会话名称..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              disabled={!sessionName.trim()}
            >
              + 新建
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">暂无会话</p>
          ) : (
            sessions.map((s: any) => (
              <div
                key={s.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === s.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                onClick={() => handleSwitchSession(s.id)}
              >
                <div className="font-medium text-sm mb-1">{s.name}</div>
                <div className="text-xs opacity-70">
                  {new Date(s.created_at).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">
            {currentSessionId
              ? sessions.find((s: any) => s.id === currentSessionId)?.name ||
                "选择会话"
              : "请选择或创建会话"}
          </h2>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentSessionId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg">选择一个会话开始聊天</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">开始新的对话...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-700 bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder={currentSessionId ? "输入消息..." : "请先选择会话"}
              disabled={loading || !currentSessionId}
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim() || !currentSessionId}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  发送中
                </span>
              ) : (
                "发送"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
