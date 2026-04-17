import type { LlmMessage, LlmProvider } from "./chat";

export type ReasoningConfig = {
  enabled?: boolean;
  effort?: "low" | "medium" | "high";
  budgetTokens?: number;
};

export type UnifiedChatRequest = {
  provider: LlmProvider | string;
  model: string;
  messages: LlmMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  reasoning?: ReasoningConfig;
};

export interface AIModelAdapter {
  provider: string;
  getEndpoint(request: UnifiedChatRequest): string;
  getHeaders(apiKey: string): Record<string, string>;
  transformRequest(request: UnifiedChatRequest): unknown;
}
