export interface AgentConfigOptions {
  model?: string;
  provider?: string; // 'google' | 'openai' etc.
  systemPrompt?: string; // system prompt override
  tools?: unknown[]; // tools from registry or direct tool objects
  autoToolCall?: boolean; // if true, skip tool approval prompts and auto-execute tools
  mcpConfigs?: Array<{ url: string; headers?: Record<string, string> }>; // Multiple MCP server configurations with auth headers
  enabledTools?: string[]; // List of enabled tool IDs (e.g., ["internal:get_weather", "mcp:oss_file_list"])
}
