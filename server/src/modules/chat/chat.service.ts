import { Injectable } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { ChatStreamDto } from './dto/chat-stream.dto';
import {
  ConversationDetailDto,
  ConversationListResponseDto,
} from './dto/conversation-response.dto';
import { ChatSseEvent } from './interfaces/sse-event.interface';
import { ConversationsService } from './conversations.service';
import { ConversationListQueryDto } from './dto/conversation-query.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly llmService: LlmService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async listConversations(
    userId: string,
    query: ConversationListQueryDto,
  ): Promise<ConversationListResponseDto> {
    return this.conversationsService.listConversations(userId, query);
  }

  async getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetailDto> {
    return this.conversationsService.getConversationDetail(
      userId,
      conversationId,
    );
  }

  async *stream(
    payload: ChatStreamDto,
    userId: string,
    requestId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatSseEvent> {
    //解析 LLM 配置（provider + model）
    const resolved = this.llmService.resolveConfig(payload);
    //准备会话：新建 or 续聊，并持久化用户消息
    const conversation =
      await this.conversationsService.prepareConversationForStream(
        userId,
        payload,
        requestId,
      );
    // 告诉前端本轮流式会话 ID
    yield {
      event: 'meta',
      data: {
        requestId,
        conversationId: conversation.conversationId,
        provider: resolved.provider,
        model: resolved.model,
      },
    };
    //流式调用 LLM，yield 每个 delta
    let assistantContent = '';

    try {
      for await (const text of this.llmService.streamText(
        {
          ...payload,
          messages: conversation.messages,
        },
        signal,
      )) {
        assistantContent += text;
        yield {
          event: 'delta',
          data: {
            requestId,
            conversationId: conversation.conversationId,
            text,
          },
        };
      }
      //流结束后一次性持久化 assistant 回复
      //每个 token 累加到 assistantContent ，流结束后一次性落库
      await this.conversationsService.appendAssistantReply({
        conversationId: conversation.conversationId,
        content: assistantContent,
        requestId,
        provider: resolved.provider,
        model: resolved.model,
        temperature: payload.temperature,
        maxTokens: payload.maxTokens,
      });
    } catch (error) {
      //LLM 调用失败但已有部分输出 → 尽量保存部分回复
      if (assistantContent.trim()) {
        await this.conversationsService.appendAssistantReply({
          conversationId: conversation.conversationId,
          content: assistantContent,
          requestId,
          provider: resolved.provider,
          model: resolved.model,
          temperature: payload.temperature,
          maxTokens: payload.maxTokens,
        });
      }

      throw error;
    }
  }
}
