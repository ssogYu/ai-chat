import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { GoogleProvider } from './providers/google.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  providers: [
    LlmService,
    OpenAiProvider,
    AnthropicProvider,
    GoogleProvider,
    DeepSeekProvider,
    OllamaProvider,
  ],
  exports: [LlmService],
})
export class LlmModule {}
