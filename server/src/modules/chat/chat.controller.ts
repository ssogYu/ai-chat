import { randomUUID } from 'node:crypto';
import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AccessTokenGuard } from '../../common/guards';
import { ChatStreamDto } from './dto/chat-stream.dto';
import { ChatService } from './chat.service';
import { ChatSseEventType } from './interfaces/sse-event.interface';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'SSE 流式对话' })
  @ApiBearerAuth('access-token')
  @ApiConsumes('application/json')
  @ApiProduces('text/event-stream')
  @ApiBody({ type: ChatStreamDto })
  async stream(
    @Body() payload: ChatStreamDto,
    @Res() res: Response,
  ): Promise<void> {
    const requestId = randomUUID();
    const abortController = new AbortController();

    this.setSseHeaders(res);
    const writeEvent = (
      event: ChatSseEventType,
      data: Record<string, unknown>,
    ) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    res.on('close', () => {
      abortController.abort();
      clearInterval(heartbeat);
      if (!res.writableEnded) {
        res.end();
      }
    });

    try {
      for await (const event of this.chatService.stream(
        payload,
        requestId,
        abortController.signal,
      )) {
        writeEvent(event.event, event.data);
      }

      writeEvent('done', { requestId });
      clearInterval(heartbeat);
      res.end();
    } catch (error) {
      writeEvent('error', {
        requestId,
        message: error instanceof Error ? error.message : '流式请求失败',
      });
      clearInterval(heartbeat);
      res.end();
    }
  }

  private setSseHeaders(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
  }
}
