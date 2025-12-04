export interface AgentConfigOptions {
  model?: string;
  provider?: string; // 'google' | 'openai' etc.
  systemPrompt?: string; // system prompt override
  tools?: unknown[]; // tools from registry or direct tool objects
  approveAllTools?: boolean; // if true, skip tool approval prompts
}
