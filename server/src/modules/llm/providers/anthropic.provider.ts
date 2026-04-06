import { ChatAnthropic } from '@langchain/anthropic';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmModelOptions,
  LlmProviderAdapter,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class AnthropicProvider implements LlmProviderAdapter {
  readonly provider = 'anthropic' as const;

  constructor(private readonly configService: ConfigService) {}

  createChatModel(options: LlmModelOptions) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('ANTHROPIC_API_KEY 未配置');
    }

    return new ChatAnthropic({
      apiKey,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
  }
}
