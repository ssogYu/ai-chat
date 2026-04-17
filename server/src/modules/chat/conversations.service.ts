import { Injectable } from '@nestjs/common';
import {
  BadRequestApiException,
  NotFoundApiException,
} from 'src/common/exceptions/api.exception';
import type { LlmMessage, LlmProvider, LlmRole } from '../llm/llm.types';
import { ChatStreamDto } from './dto/chat-stream.dto';
import { ConversationListQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationListItemDto,
  ConversationListResponseDto,
  type ConversationStatusValue,
} from './dto/conversation-response.dto';
import {
  ConversationMessageRecord,
  ConversationMessageRoleRecord,
  ConversationRecord,
  ConversationsRepository,
  ConversationStatusRecord,
  ConversationWithMessages,
  PersistedMessageInput,
} from './conversations.repository';

type PersistableMessage = {
  role: LlmRole;
  content: string;
};

type AssistantReplyInput = {
  conversationId: string;
  content: string;
  requestId: string;
  provider: LlmProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_TITLE_LENGTH = 80;
const MAX_PREVIEW_LENGTH = 160;

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
  ) {}

  async listConversations(
    userId: string,
    query: ConversationListQueryDto,
  ): Promise<ConversationListResponseDto> {
    const pageNo = query.pageNo ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (pageNo - 1) * pageSize;

    const [total, conversations] = await Promise.all([
      this.conversationsRepository.countActiveByUser(userId),
      this.conversationsRepository.findActiveByUser(userId, skip, pageSize),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const hasNextPage = pageNo < totalPages;

    return {
      items: conversations.map(item => this.toConversationListItem(item)),
      pageInfo: {
        pageNo,
        pageSize,
        total,
        totalPages,
        hasNextPage,
      },
    };
  }

  async getConversationDetail(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetailDto> {
    const conversation =
      await this.conversationsRepository.findByIdAndUserWithMessages(
        userId,
        conversationId,
      );

    if (!conversation) {
      throw new NotFoundApiException('会话不存在');
    }

    return {
      ...this.toConversationListItem(conversation),
      messages: conversation.messages.map(message =>
        this.toConversationMessageItem(message),
      ),
    };
  }

  async prepareConversationForStream(
    userId: string,
    payload: ChatStreamDto,
    requestId: string,
  ): Promise<{
    conversationId: string;
    messages: LlmMessage[];
  }> {
    const normalizedMessages = this.normalizeMessages(payload.messages);

    if (!payload.conversationId) {
      const conversation = await this.createConversation(
        userId,
        payload.title,
        normalizedMessages,
        requestId,
      );

      return {
        conversationId: conversation.id,
        messages: normalizedMessages,
      };
    }

    const conversation =
      await this.conversationsRepository.findByIdAndUserWithMessages(
        userId,
        payload.conversationId,
      );

    if (!conversation) {
      throw new NotFoundApiException('会话不存在');
    }

    if (conversation.status !== 'ACTIVE') {
      throw new BadRequestApiException('当前会话不可继续对话');
    }

    const storedMessages = conversation.messages.map(message =>
      this.toLlmMessage(message),
    );
    const newMessages = this.resolveNewMessages(
      storedMessages,
      normalizedMessages,
    );

    if (newMessages.length === 0) {
      throw new BadRequestApiException('未检测到新的待发送消息');
    }

    await this.appendMessages(conversation.id, newMessages, requestId);

    return {
      conversationId: conversation.id,
      messages: [...storedMessages, ...newMessages],
    };
  }

  async appendAssistantReply(input: AssistantReplyInput): Promise<void> {
    const normalizedContent = input.content.trim();

    if (!normalizedContent) {
      return;
    }

    await this.conversationsRepository.appendAssistantReply({
      conversationId: input.conversationId,
      content: normalizedContent,
      requestId: input.requestId,
      provider: input.provider,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      latestMessagePreview: this.buildPreview(normalizedContent),
    });
  }

  private async createConversation(
    userId: string,
    title: string | undefined,
    messages: PersistableMessage[],
    requestId: string,
  ): Promise<ConversationRecord> {
    return this.conversationsRepository.createConversation({
      userId,
      title: this.resolveTitle(title, messages),
      messages: messages.map(message => this.toPersistedMessage(message)),
      requestId,
      latestMessagePreview: this.buildPreview(
        messages[messages.length - 1].content,
      ),
    });
  }

  private async appendMessages(
    conversationId: string,
    messages: PersistableMessage[],
    requestId: string,
  ): Promise<void> {
    await this.conversationsRepository.appendMessages({
      conversationId,
      messages: messages.map(message => this.toPersistedMessage(message)),
      requestId,
      latestMessagePreview: this.buildPreview(
        messages[messages.length - 1].content,
      ),
    });
  }

  private normalizeMessages(
    messages: PersistableMessage[],
  ): PersistableMessage[] {
    if (!messages.length) {
      throw new BadRequestApiException('messages 不能为空');
    }

    return messages.map(message => {
      const content = message.content.trim();

      if (!content) {
        throw new BadRequestApiException('消息内容不能为空');
      }

      return {
        role: message.role,
        content,
      };
    });
  }

  private resolveNewMessages(
    storedMessages: LlmMessage[],
    incomingMessages: PersistableMessage[],
  ): PersistableMessage[] {
    if (
      incomingMessages.length >= storedMessages.length &&
      storedMessages.every((message, index) =>
        this.isSameMessage(message, incomingMessages[index]),
      )
    ) {
      return incomingMessages.slice(storedMessages.length);
    }

    if (incomingMessages.every(message => message.role !== 'assistant')) {
      return incomingMessages;
    }

    throw new BadRequestApiException(
      '续聊请求请传递完整历史并追加新消息，或仅传递新增的用户消息',
    );
  }

  private resolveTitle(
    customTitle: string | undefined,
    messages: PersistableMessage[],
  ): string {
    const preferredTitle = customTitle?.trim();

    if (preferredTitle) {
      return this.truncate(preferredTitle, MAX_TITLE_LENGTH);
    }

    const firstUserMessage =
      messages.find(message => message.role === 'user')?.content ??
      messages[0]?.content ??
      '新会话';

    return this.truncate(firstUserMessage, MAX_TITLE_LENGTH);
  }

  private truncate(value: string, maxLength: number): string {
    const normalized = value.replace(/\s+/g, ' ').trim();

    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
  }

  private buildPreview(value: string): string {
    return this.truncate(value, MAX_PREVIEW_LENGTH);
  }

  private toConversationListItem(
    conversation: ConversationRecord | ConversationWithMessages,
  ): ConversationListItemDto {
    return {
      id: conversation.id,
      title: conversation.title,
      status: this.toApiStatus(conversation.status),
      messageCount: conversation.messageCount,
      latestMessagePreview: conversation.latestMessagePreview,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private toConversationMessageItem(message: ConversationMessageRecord) {
    return {
      id: message.id,
      sequence: message.sequence,
      role: this.toApiRole(message.role),
      content: message.content,
      requestId: message.requestId,
      provider: message.provider as LlmProvider | null,
      model: message.model,
      temperature: message.temperature,
      maxTokens: message.maxTokens,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private toLlmMessage(message: ConversationMessageRecord): LlmMessage {
    return {
      role: this.toApiRole(message.role),
      content: message.content,
    };
  }

  private toPersistedMessage(
    message: PersistableMessage,
  ): PersistedMessageInput {
    return {
      role: this.toPrismaRole(message.role),
      content: message.content,
    };
  }

  private toPrismaRole(role: LlmRole): ConversationMessageRoleRecord {
    if (role === 'system') {
      return 'SYSTEM';
    }

    if (role === 'assistant') {
      return 'ASSISTANT';
    }

    return 'USER';
  }

  private toApiRole(role: ConversationMessageRoleRecord): LlmRole {
    if (role === 'SYSTEM') {
      return 'system';
    }

    if (role === 'ASSISTANT') {
      return 'assistant';
    }

    return 'user';
  }

  private toApiStatus(
    status: ConversationStatusRecord,
  ): ConversationStatusValue {
    if (status === 'ARCHIVED') {
      return 'archived';
    }

    return 'active';
  }

  private isSameMessage(
    left: Pick<LlmMessage, 'role' | 'content'> | undefined,
    right: Pick<LlmMessage, 'role' | 'content'> | undefined,
  ): boolean {
    return left?.role === right?.role && left?.content === right?.content;
  }
}
