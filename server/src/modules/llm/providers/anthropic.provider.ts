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
      thinking: this.buildThinkingConfig(options),
      outputConfig:
        options.reasoning?.enabled && options.reasoning.effort
          ? {
              effort: this.toAnthropicEffort(options.reasoning.effort),
            }
          : undefined,
    });
  }

  private buildThinkingConfig(options: LlmModelOptions) {
    if (!options.reasoning?.enabled || !this.supportsThinking(options.model)) {
      return undefined;
    }

    return {
      type: 'enabled',
      budget_tokens: options.reasoning.budgetTokens ?? 2048,
    } as const;
  }

  private supportsThinking(model: string) {
    return /claude-(3-7|4|sonnet-4|opus-4)/i.test(model);
  }

  private toAnthropicEffort(
    effort: NonNullable<LlmModelOptions['reasoning']>['effort'],
  ) {
    if (!effort || effort === 'max') {
      return 'high';
    }

    return effort;
  }
}
