import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ChatStreamDto } from './dto/chat-stream.dto';
import { ChatSseEvent } from './interfaces/sse-event.interface';

@Injectable()
export class ChatService {
  constructor(private readonly llmService: LlmService) {}

  async *stream(
    payload: ChatStreamDto,
    requestId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatSseEvent> {
    const resolved = this.llmService.resolveConfig(payload);
    yield {
      event: 'meta',
      data: {
        requestId,
        provider: resolved.provider,
        model: resolved.model,
      },
    };

    for await (const text of this.llmService.streamText(payload, signal)) {
      yield {
        event: 'delta',
        data: {
          requestId,
          text,
        },
      };
    }
  }
}
