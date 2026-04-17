import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmModelOptions,
  LlmProviderAdapter,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GoogleProvider implements LlmProviderAdapter {
  readonly provider = 'google' as const;

  constructor(private readonly configService: ConfigService) {}

  createChatModel(options: LlmModelOptions) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GOOGLE_API_KEY 未配置');
    }

    return new ChatGoogleGenerativeAI({
      apiKey,
      model: options.model,
      temperature: options.temperature,
      maxOutputTokens: options.maxTokens,
      thinkingConfig: this.buildThinkingConfig(options),
    });
  }

  private buildThinkingConfig(options: LlmModelOptions) {
    if (!options.reasoning?.enabled || !this.supportsThinking(options.model)) {
      return undefined;
    }

    return {
      includeThoughts: true,
      thinkingBudget:
        options.reasoning.budgetTokens ??
        this.getDefaultThinkingBudget(options.reasoning.effort),
      thinkingLevel: this.toThinkingLevel(options.reasoning.effort),
    };
  }

  private supportsThinking(model: string) {
    return /gemini-2\.5|thinking/i.test(model);
  }

  private toThinkingLevel(
    effort: NonNullable<LlmModelOptions['reasoning']>['effort'],
  ) {
    if (!effort) {
      return 'MEDIUM' as const;
    }

    if (effort === 'max') {
      return 'HIGH' as const;
    }

    return effort.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH';
  }

  private getDefaultThinkingBudget(
    effort: NonNullable<LlmModelOptions['reasoning']>['effort'],
  ) {
    if (effort === 'low') {
      return 1024;
    }

    if (effort === 'high' || effort === 'max') {
      return 8192;
    }

    return 4096;
  }
}
