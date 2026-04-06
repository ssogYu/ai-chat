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
    });
  }
}
