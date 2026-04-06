import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { LlmProviderAdapter } from './interfaces/llm-provider.interface';
import {
  LLM_PROVIDER_VALUES,
  LlmMessage,
  LlmProvider,
  LlmResolvedConfig,
  LlmStreamRequest,
} from './llm.types';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GoogleProvider } from './providers/google.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class LlmService {
  private readonly providerMap: Map<LlmProvider, LlmProviderAdapter>;

  constructor(
    private readonly configService: ConfigService,
    openAiProvider: OpenAiProvider,
    anthropicProvider: AnthropicProvider,
    googleProvider: GoogleProvider,
    deepSeekProvider: DeepSeekProvider,
    ollamaProvider: OllamaProvider,
  ) {
    const providers: LlmProviderAdapter[] = [
      openAiProvider,
      anthropicProvider,
      googleProvider,
      deepSeekProvider,
      ollamaProvider,
    ];

    this.providerMap = new Map(
      providers.map(provider => [provider.provider, provider]),
    );
  }

  resolveConfig(request: LlmStreamRequest): LlmResolvedConfig {
    //校验 provider（厂商） 是否在允许的范围内
    const defaultProvider =
      this.configService.get<LlmProvider>('LLM_DEFAULT_PROVIDER') || 'openai';
    const provider = request.provider || defaultProvider;
    const allowedProviders = new Set<LlmProvider>(LLM_PROVIDER_VALUES);

    if (!allowedProviders.has(provider)) {
      throw new BadRequestException(`不支持的 provider: ${provider}`);
    }
    //获取对应的模型
    const model = request.model || this.getDefaultModel(provider);
    return { provider, model };
  }

  async *streamText(
    request: LlmStreamRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    if (request.messages.length === 0) {
      throw new BadRequestException('messages 不能为空');
    }

    const { provider, model } = this.resolveConfig(request);
    const providerAdapter = this.providerMap.get(provider);

    if (!providerAdapter) {
      throw new BadRequestException(`provider 未注册: ${provider}`);
    }

    const chatModel = providerAdapter.createChatModel({
      model,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
    });

    const stream = await chatModel.stream(
      this.toLangChainMessages(request.messages),
      {
        signal,
      },
    );

    for await (const chunk of stream) {
      const texts = this.extractChunkText(chunk.content);
      for (const text of texts) {
        yield text;
      }
    }
  }

  private toLangChainMessages(messages: LlmMessage[]): BaseMessage[] {
    return messages.map(message => {
      if (message.role === 'system') {
        return new SystemMessage(message.content);
      }

      if (message.role === 'assistant') {
        return new AIMessage(message.content);
      }

      return new HumanMessage(message.content);
    });
  }

  private getDefaultModel(provider: LlmProvider): string {
    if (provider === 'openai') {
      return this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    }

    if (provider === 'anthropic') {
      return (
        this.configService.get<string>('ANTHROPIC_MODEL') ||
        'claude-3-5-sonnet-latest'
      );
    }

    if (provider === 'google') {
      return (
        this.configService.get<string>('GOOGLE_MODEL') || 'gemini-2.5-flash'
      );
    }

    if (provider === 'ollama') {
      return this.configService.get<string>('OLLAMA_MODEL') || 'qwen2.5:7b';
    }

    return this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
  }

  private extractChunkText(content: unknown): string[] {
    if (typeof content === 'string') {
      return content.length > 0 ? [content] : [];
    }

    if (!Array.isArray(content)) {
      return [];
    }

    const textList: string[] = [];
    for (const item of content as unknown[]) {
      if (typeof item === 'string' && item.length > 0) {
        textList.push(item);
        continue;
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof item.text === 'string' &&
        item.text.length > 0
      ) {
        textList.push(item.text);
      }
    }

    return textList;
  }
}
