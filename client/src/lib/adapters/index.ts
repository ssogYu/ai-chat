import { AIModelAdapter } from "@/types";
import { OpenAIAdapter } from '../adapters/openai-adapter';
import { AnthropicAdapter } from '../adapters/anthropic-adapter';
import { GeminiAdapter } from '../adapters/gemini-adapter';

export type ProviderType = 'openai' | 'anthropic' | 'google' | string;

export class AIAdapterFactory {
  private static adapters: Map<string, AIModelAdapter> = new Map<string, AIModelAdapter>([
    ['openai', new OpenAIAdapter()],
    ['anthropic', new AnthropicAdapter()],
    ['google', new GeminiAdapter()],
  ]);
  /**
   * 注册新的适配器 (支持动态扩展第三方厂商)
   */
  static registerAdapter(provider: string, adapter: AIModelAdapter) {
    this.adapters.set(provider, adapter);
  }

  /**
   * 获取对应的适配器
   */
  static getAdapter(provider: ProviderType): AIModelAdapter {
    const adapter = this.adapters.get(provider.toLowerCase());
    if (!adapter) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
    return adapter;
  }
}