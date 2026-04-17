import { ChatOllama } from '@langchain/ollama';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmModelOptions,
  LlmProviderAdapter,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OllamaProvider implements LlmProviderAdapter {
  readonly provider = 'ollama' as const;

  constructor(private readonly configService: ConfigService) {}

  createChatModel(options: LlmModelOptions) {
    const baseUrl =
      this.configService.get<string>('OLLAMA_BASE_URL') ||
      'http://127.0.0.1:11434';

    const modelConfig: Record<string, unknown> = {
      baseUrl,
      model: options.model,
      temperature: options.temperature,
      numPredict: options.maxTokens,
    };

    if (options.reasoning?.enabled) {
      modelConfig.think = this.toOllamaThinkValue(options);
    }

    return new ChatOllama(
      modelConfig as ConstructorParameters<typeof ChatOllama>[0],
    );
  }

  private toOllamaThinkValue(options: LlmModelOptions) {
    if (/gpt-oss/i.test(options.model)) {
      const effort = options.reasoning?.effort;
      if (effort === 'low' || effort === 'medium' || effort === 'high') {
        return effort;
      }

      return 'medium';
    }

    return true;
  }
}
