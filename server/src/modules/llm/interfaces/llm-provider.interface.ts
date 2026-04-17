import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LlmProvider, type LlmReasoningConfig } from '../llm.types';

export interface LlmModelOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  reasoning?: LlmReasoningConfig;
}

export interface LlmProviderAdapter {
  readonly provider: LlmProvider;
  createChatModel(options: LlmModelOptions): BaseChatModel;
}
