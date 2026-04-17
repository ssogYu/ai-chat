import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChatStreamDto } from './dto/chat-stream.dto';
import { ConversationListQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationListResponseDto,
} from './dto/conversation-response.dto';
import { ChatService } from './chat.service';
import { ChatSseEventType } from './interfaces/sse-event.interface';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: '分页获取当前用户的会话列表' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: ConversationListResponseDto })
  @ApiQuery({ name: 'pageNo', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async listConversations(
    @CurrentUser() currentUser: AuthUser,
    @Query() query: ConversationListQueryDto,
  ) {
    return this.chatService.listConversations(currentUser.sub, query);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: '获取单条会话详情及完整消息记录' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'conversationId', description: '会话 ID' })
  @ApiOkResponse({ type: ConversationDetailDto })
  async getConversationDetail(
    @CurrentUser() currentUser: AuthUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getConversationDetail(
      currentUser.sub,
      conversationId,
    );
  }

  @Post('stream')
  @ApiOperation({ summary: 'SSE 流式对话' })
  @ApiBearerAuth('access-token')
  @ApiConsumes('application/json')
  @ApiProduces('text/event-stream')
  @ApiBody({ type: ChatStreamDto })
  async stream(
    @Body() payload: ChatStreamDto,
    @CurrentUser() currentUser: AuthUser,
    @Res() res: Response,
  ): Promise<void> {
    const requestId = randomUUID();
    const abortController = new AbortController();
    let conversationId: string | undefined;

    this.setSseHeaders(res);
    const writeEvent = (
      event: ChatSseEventType,
      data: Record<string, unknown>,
    ) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': ping\n\n');
      }
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
        currentUser.sub,
        requestId,
        abortController.signal,
      )) {
        if (event.event === 'meta') {
          conversationId = event.data.conversationId as string | undefined;
        }
        writeEvent(event.event, event.data);
      }

      writeEvent('done', { requestId, conversationId });
      clearInterval(heartbeat);
      if (!res.writableEnded) {
        res.end();
      }
    } catch (error) {
      writeEvent('error', {
        requestId,
        conversationId,
        message: error instanceof Error ? error.message : '流式请求失败',
      });
      clearInterval(heartbeat);
      if (!res.writableEnded) {
        res.end();
      }
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
