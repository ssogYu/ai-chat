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
  LlmStreamChunk,
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
    const model =
      request.model ||
      this.getDefaultModel(provider, request.reasoning?.enabled);
    return { provider, model };
  }

  async *streamText(
    request: LlmStreamRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<LlmStreamChunk> {
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
      reasoning: request.reasoning,
    });

    const stream = await chatModel.stream(
      this.toLangChainMessages(request.messages),
      {
        signal,
      },
    );

    const parser = new ThinkTagStreamParser();

    for await (const chunk of stream) {
      const extractedChunks = this.extractStreamChunks(chunk);
      for (const extractedChunk of extractedChunks) {
        if (extractedChunk.type === 'reasoning') {
          yield extractedChunk;
          continue;
        }

        const parsedTextChunks = parser.feed(extractedChunk.text);
        for (const parsedTextChunk of parsedTextChunks) {
          yield parsedTextChunk;
        }
      }
    }

    for (const tailChunk of parser.flush()) {
      yield tailChunk;
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

  private getDefaultModel(
    provider: LlmProvider,
    reasoningEnabled?: boolean,
  ): string {
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

    if (reasoningEnabled) {
      return (
        this.configService.get<string>('DEEPSEEK_REASONING_MODEL') ||
        'deepseek-reasoner'
      );
    }

    return this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
  }

  private extractStreamChunks(chunk: {
    content: unknown;
    additional_kwargs?: Record<string, unknown>;
  }): LlmStreamChunk[] {
    const chunks: LlmStreamChunk[] = [];
    const reasoningContent = this.extractReasoningContent(
      chunk.additional_kwargs?.reasoning_content,
    );

    for (const text of reasoningContent) {
      chunks.push({
        type: 'reasoning',
        text,
      });
    }

    for (const item of this.extractContentItems(chunk.content)) {
      chunks.push(item);
    }

    return chunks;
  }

  private extractReasoningContent(content: unknown): string[] {
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

  private extractContentItems(content: unknown): LlmStreamChunk[] {
    if (typeof content === 'string') {
      return content.length > 0 ? [{ type: 'text', text: content }] : [];
    }

    if (!Array.isArray(content)) {
      return [];
    }

    const items: LlmStreamChunk[] = [];
    for (const item of content as unknown[]) {
      if (typeof item === 'string' && item.length > 0) {
        items.push({ type: 'text', text: item });
        continue;
      }

      if (typeof item !== 'object' || item === null) {
        continue;
      }

      if (
        'type' in item &&
        item.type === 'thinking' &&
        'thinking' in item &&
        typeof item.thinking === 'string' &&
        item.thinking.length > 0
      ) {
        items.push({ type: 'reasoning', text: item.thinking });
        continue;
      }

      if (
        'type' in item &&
        item.type === 'reasoning' &&
        'reasoning' in item &&
        typeof item.reasoning === 'string' &&
        item.reasoning.length > 0
      ) {
        items.push({ type: 'reasoning', text: item.reasoning });
        continue;
      }

      if (
        'text' in item &&
        typeof item.text === 'string' &&
        item.text.length > 0
      ) {
        items.push({ type: 'text', text: item.text });
      }
    }

    return items;
  }
}

class ThinkTagStreamParser {
  private readonly openTag = '<think>';
  private readonly closeTag = '</think>';
  private buffer = '';
  private mode: 'text' | 'reasoning' = 'text';

  feed(input: string): LlmStreamChunk[] {
    this.buffer += input;
    const output: LlmStreamChunk[] = [];

    while (this.buffer.length > 0) {
      if (this.mode === 'text') {
        const openIndex = this.buffer.indexOf(this.openTag);
        if (openIndex >= 0) {
          this.push(output, 'text', this.buffer.slice(0, openIndex));
          this.buffer = this.buffer.slice(openIndex + this.openTag.length);
          this.mode = 'reasoning';
          continue;
        }

        const prefixLength = this.getTrailingPrefixLength(
          this.buffer,
          this.openTag,
        );
        const flushLength = this.buffer.length - prefixLength;
        if (flushLength <= 0) {
          break;
        }

        this.push(output, 'text', this.buffer.slice(0, flushLength));
        this.buffer = this.buffer.slice(flushLength);
        continue;
      }

      const closeIndex = this.buffer.indexOf(this.closeTag);
      if (closeIndex >= 0) {
        this.push(output, 'reasoning', this.buffer.slice(0, closeIndex));
        this.buffer = this.buffer.slice(closeIndex + this.closeTag.length);
        this.mode = 'text';
        continue;
      }

      const prefixLength = this.getTrailingPrefixLength(
        this.buffer,
        this.closeTag,
      );
      const flushLength = this.buffer.length - prefixLength;
      if (flushLength <= 0) {
        break;
      }

      this.push(output, 'reasoning', this.buffer.slice(0, flushLength));
      this.buffer = this.buffer.slice(flushLength);
    }

    return output;
  }

  flush(): LlmStreamChunk[] {
    const output: LlmStreamChunk[] = [];
    if (!this.buffer) {
      return output;
    }

    this.push(output, this.mode, this.buffer);
    this.buffer = '';
    return output;
  }

  private push(
    list: LlmStreamChunk[],
    type: LlmStreamChunk['type'],
    text: string,
  ) {
    if (text.length > 0) {
      list.push({ type, text });
    }
  }

  private getTrailingPrefixLength(value: string, target: string): number {
    const maxLength = Math.min(value.length, target.length - 1);

    for (let size = maxLength; size > 0; size -= 1) {
      if (value.endsWith(target.slice(0, size))) {
        return size;
      }
    }

    return 0;
  }
}
