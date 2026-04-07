import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BadRequestApiException,
  NotFoundApiException,
} from 'src/common/exceptions/api.exception';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { LlmMessage, LlmProvider, LlmRole } from '../llm/llm.types';
import { ChatStreamDto } from './dto/chat-stream.dto';
import { ConversationListQueryDto } from './dto/conversation-query.dto';
import {
  ConversationDetailDto,
  ConversationListItemDto,
  ConversationListResponseDto,
  type ConversationStatusValue,
} from './dto/conversation-response.dto';

type PersistableMessage = {
  role: LlmRole;
  content: string;
};

type ConversationStatusRecord = 'ACTIVE' | 'ARCHIVED';
type ConversationMessageRoleRecord = 'SYSTEM' | 'USER' | 'ASSISTANT';
type ConversationRecord = {
  id: string;
  userId: string;
  title: string;
  status: ConversationStatusRecord;
  messageCount: number;
  lastMessageAt: Date;
  latestMessagePreview: string | null;
  createdAt: Date;
  updatedAt: Date;
};
type ConversationMessageRecord = {
  id: string;
  conversationId: string;
  role: ConversationMessageRoleRecord;
  content: string;
  sequence: number;
  requestId: string | null;
  provider: string | null;
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};
type ConversationWithMessages = ConversationRecord & {
  messages: ConversationMessageRecord[];
};
type ConversationCounter = Pick<ConversationRecord, 'id' | 'messageCount'>;
type ConversationModelDelegate = {
  findMany(args: Record<string, unknown>): Promise<ConversationRecord[]>;
  findFirst(
    args: Record<string, unknown>,
  ): Promise<ConversationWithMessages | null>;
  findUnique(
    args: Record<string, unknown>,
  ): Promise<ConversationCounter | null>;
  count(args: Record<string, unknown>): Promise<number>;
  create(args: Record<string, unknown>): Promise<ConversationRecord>;
  update(args: Record<string, unknown>): Promise<ConversationRecord>;
};
type ConversationMessageModelDelegate = {
  create(args: Record<string, unknown>): Promise<ConversationMessageRecord>;
  createMany(args: Record<string, unknown>): Promise<Prisma.BatchPayload>;
};
type TransactionClientWithConversation = Prisma.TransactionClient & {
  conversation: ConversationModelDelegate;
  conversationMessage: ConversationMessageModelDelegate;
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
  constructor(private readonly prismaService: PrismaService) {}

  async listConversations(
    userId: string,
    query: ConversationListQueryDto,
  ): Promise<ConversationListResponseDto> {
    const pageNo = query.pageNo ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const skip = (pageNo - 1) * pageSize;
    const where = {
      userId,
      status: 'ACTIVE',
    } satisfies Record<string, unknown>;

    const [total, conversations] = await Promise.all([
      this.conversationModel.count({
        where,
      }),
      this.conversationModel.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
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
    const conversation = await this.conversationModel.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      include: {
        messages: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

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

    const conversation = await this.conversationModel.findFirst({
      where: {
        id: payload.conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundApiException('会话不存在');
    }

    if (conversation.status !== 'ACTIVE') {
      throw new BadRequestApiException('当前会话不可继续对话');
    }

    const storedMessages = conversation.messages.map(message =>
      this.toLlmMessage(message),
    );
    //增量检测：判断前端传来的是完整历史还是仅新增消息
    const newMessages = this.resolveNewMessages(
      storedMessages,
      normalizedMessages,
    );

    if (newMessages.length === 0) {
      throw new BadRequestApiException('未检测到新的待发送消息');
    }
    //追加新消息到数据库
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

    await this.prismaService.$transaction(
      async tx => {
        const client = tx as TransactionClientWithConversation;
        const conversation = await client.conversation.findUnique({
          where: {
            id: input.conversationId,
          },
          select: {
            id: true,
            messageCount: true,
          },
        });

        if (!conversation) {
          throw new NotFoundApiException('会话不存在');
        }

        const messageTimestamp = new Date();
        // 创建 assistant 消息记录，保留 provider/model/temperature/maxTokens 快照
        await client.conversationMessage.create({
          data: {
            conversationId: input.conversationId,
            role: 'ASSISTANT',
            content: normalizedContent,
            sequence: conversation.messageCount + 1,
            requestId: input.requestId,
            provider: input.provider,
            model: input.model,
            temperature: input.temperature,
            maxTokens: input.maxTokens,
            createdAt: messageTimestamp,
            updatedAt: messageTimestamp,
          },
        });
        // 更新会话计数 + 摘要 + 时间
        await client.conversation.update({
          where: {
            id: input.conversationId,
          },
          data: {
            messageCount: conversation.messageCount + 1,
            lastMessageAt: messageTimestamp,
            latestMessagePreview: this.buildPreview(normalizedContent),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async createConversation(
    userId: string,
    title: string | undefined,
    messages: PersistableMessage[],
    requestId: string,
  ): Promise<ConversationRecord> {
    const timestamp = new Date();

    return this.prismaService.$transaction(
      async tx => {
        const client = tx as TransactionClientWithConversation;

        return client.conversation.create({
          data: {
            userId,
            title: this.resolveTitle(title, messages),
            messageCount: messages.length,
            lastMessageAt: timestamp,
            latestMessagePreview: this.buildPreview(
              messages[messages.length - 1].content,
            ),
            messages: {
              create: messages.map((message, index) => ({
                role: this.toPrismaRole(message.role),
                content: message.content,
                sequence: index + 1,
                requestId,
                createdAt: timestamp,
                updatedAt: timestamp,
              })),
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  private async appendMessages(
    conversationId: string,
    messages: PersistableMessage[],
    requestId: string,
  ): Promise<void> {
    await this.prismaService.$transaction(
      async tx => {
        //查当前 messageCount（锁住这行记录）
        const client = tx as TransactionClientWithConversation;
        const conversation = await client.conversation.findUnique({
          where: {
            id: conversationId,
          },
          select: {
            id: true,
            messageCount: true,
          },
        });

        if (!conversation) {
          throw new NotFoundApiException('会话不存在');
        }

        const messageTimestamp = new Date();
        //批量创建新消息，sequence 接续
        await client.conversationMessage.createMany({
          data: messages.map((message, index) => ({
            conversationId,
            role: this.toPrismaRole(message.role),
            content: message.content,
            sequence: conversation.messageCount + index + 1, // 接续编号
            requestId,
            createdAt: messageTimestamp,
            updatedAt: messageTimestamp,
          })),
        });
        //更新会话的计数 + 最新消息摘要 + 时间
        await client.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            messageCount: conversation.messageCount + messages.length,
            lastMessageAt: messageTimestamp,
            latestMessagePreview: this.buildPreview(
              messages[messages.length - 1].content,
            ),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
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
    // 前端传了完整历史 → 取增量部分
    if (
      incomingMessages.length >= storedMessages.length &&
      storedMessages.every((message, index) =>
        this.isSameMessage(message, incomingMessages[index]),
      )
    ) {
      return incomingMessages.slice(storedMessages.length);
    }
    //前端只传了新消息（不带 assistant）→ 全部当作新增
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

  private toPrismaRole(role: LlmRole): 'SYSTEM' | 'USER' | 'ASSISTANT' {
    if (role === 'system') {
      return 'SYSTEM';
    }

    if (role === 'assistant') {
      return 'ASSISTANT';
    }

    return 'USER';
  }

  private toApiRole(role: ConversationMessageRecord['role']): LlmRole {
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

  private get conversationModel(): ConversationModelDelegate {
    return this.prismaService['conversation'] as ConversationModelDelegate;
  }
}
