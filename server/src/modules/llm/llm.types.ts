export const LLM_PROVIDER_VALUES = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'ollama',
] as const;

export type LlmProvider = (typeof LLM_PROVIDER_VALUES)[number];

export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmStreamRequest {
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: LlmMessage[];
}

export interface LlmResolvedConfig {
  provider: LlmProvider;
  model: string;
}
