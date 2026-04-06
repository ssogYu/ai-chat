export const LLM_PROVIDER_VALUES = [
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "ollama",
] as const;

export type LlmProvider = (typeof LLM_PROVIDER_VALUES)[number];
export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};
export type chatStreanRequest = {
  provider: LlmProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  messages: LlmMessage[];
};
