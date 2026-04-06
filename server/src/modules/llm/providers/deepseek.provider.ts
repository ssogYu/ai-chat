import { ChatOpenAI } from '@langchain/openai';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmModelOptions,
  LlmProviderAdapter,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class DeepSeekProvider implements LlmProviderAdapter {
  readonly provider = 'deepseek' as const;

  constructor(private readonly configService: ConfigService) {}

  createChatModel(options: LlmModelOptions) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('DEEPSEEK_API_KEY 未配置');
    }

    const baseURL =
      this.configService.get<string>('DEEPSEEK_BASE_URL') ||
      'https://api.deepseek.com/v1';

    return new ChatOpenAI({
      apiKey,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      configuration: {
        baseURL,
      },
    });
  }
}
