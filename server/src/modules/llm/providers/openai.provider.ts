import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import {
  LlmModelOptions,
  LlmProviderAdapter,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAiProvider implements LlmProviderAdapter {
  readonly provider = 'openai' as const;

  constructor(private readonly configService: ConfigService) {}

  createChatModel(options: LlmModelOptions) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY 未配置');
    }

    return new ChatOpenAI({
      apiKey,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      reasoning:
        options.reasoning?.enabled && options.reasoning.effort
          ? { effort: this.toOpenAiReasoningEffort(options.reasoning.effort) }
          : undefined,
    });
  }

  private toOpenAiReasoningEffort(
    effort: NonNullable<LlmModelOptions['reasoning']>['effort'],
  ) {
    if (!effort || effort === 'max') {
      return 'high';
    }

    return effort;
  }
}
