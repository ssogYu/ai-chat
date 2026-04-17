export const LLM_PROVIDER_VALUES = [
  'openai',
  'anthropic',
  'google',
  'deepseek',
  'ollama',
] as const;

export type LlmProvider = (typeof LLM_PROVIDER_VALUES)[number];

export type LlmRole = 'system' | 'user' | 'assistant';

export const LLM_REASONING_EFFORT_VALUES = [
  'low',
  'medium',
  'high',
  'max',
] as const;

export type LlmReasoningEffort = (typeof LLM_REASONING_EFFORT_VALUES)[number];

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmReasoningConfig {
  enabled?: boolean;
  effort?: LlmReasoningEffort;
  budgetTokens?: number;
}

export interface LlmStreamRequest {
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  reasoning?: LlmReasoningConfig;
  messages: LlmMessage[];
}

export interface LlmResolvedConfig {
  provider: LlmProvider;
  model: string;
}

export type LlmStreamChunkType = 'text' | 'reasoning';

export interface LlmStreamChunk {
  type: LlmStreamChunkType;
  text: string;
}
