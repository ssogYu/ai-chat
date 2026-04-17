import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundApiException } from 'src/common/exceptions/api.exception';
import { PrismaService } from '../../database/prisma/prisma.service';

export type ConversationStatusRecord = 'ACTIVE' | 'ARCHIVED';
export type ConversationMessageRoleRecord = 'SYSTEM' | 'USER' | 'ASSISTANT';

export type ConversationRecord = {
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

export type ConversationMessageRecord = {
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

export type ConversationWithMessages = ConversationRecord & {
  messages: ConversationMessageRecord[];
};

export type PersistedMessageInput = {
  role: ConversationMessageRoleRecord;
  content: string;
};

type CreateConversationInput = {
  userId: string;
  title: string;
  messages: PersistedMessageInput[];
  requestId: string;
  latestMessagePreview: string;
};

type AppendMessagesInput = {
  conversationId: string;
  messages: PersistedMessageInput[];
  requestId: string;
  latestMessagePreview: string;
};

type AppendAssistantReplyInput = {
  conversationId: string;
  content: string;
  requestId: string;
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  latestMessagePreview: string;
};

@Injectable()
export class ConversationsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async countActiveByUser(userId: string): Promise<number> {
    return this.prismaService.conversation.count({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async findActiveByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<ConversationRecord[]> {
    return this.prismaService.conversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    });
  }

  async findByIdAndUserWithMessages(
    userId: string,
    conversationId: string,
  ): Promise<ConversationWithMessages | null> {
    return this.prismaService.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async createConversation(
    input: CreateConversationInput,
  ): Promise<ConversationRecord> {
    const timestamp = new Date();

    return this.prismaService.$transaction(
      async tx => {
        return tx.conversation.create({
          data: {
            userId: input.userId,
            title: input.title,
            messageCount: input.messages.length,
            lastMessageAt: timestamp,
            latestMessagePreview: input.latestMessagePreview,
            messages: {
              create: input.messages.map((message, index) => ({
                role: message.role,
                content: message.content,
                sequence: index + 1,
                requestId: input.requestId,
                createdAt: timestamp,
                updatedAt: timestamp,
              })),
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async appendMessages(input: AppendMessagesInput): Promise<void> {
    if (input.messages.length === 0) {
      return;
    }

    await this.prismaService.$transaction(
      async tx => {
        const conversation = await tx.conversation.findUnique({
          where: { id: input.conversationId },
          select: { id: true, messageCount: true },
        });

        if (!conversation) {
          throw new NotFoundApiException('会话不存在');
        }

        const messageTimestamp = new Date();
        await tx.conversationMessage.createMany({
          data: input.messages.map((message, index) => ({
            conversationId: input.conversationId,
            role: message.role,
            content: message.content,
            sequence: conversation.messageCount + index + 1,
            requestId: input.requestId,
            createdAt: messageTimestamp,
            updatedAt: messageTimestamp,
          })),
        });

        await tx.conversation.update({
          where: { id: input.conversationId },
          data: {
            messageCount: conversation.messageCount + input.messages.length,
            lastMessageAt: messageTimestamp,
            latestMessagePreview: input.latestMessagePreview,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async appendAssistantReply(input: AppendAssistantReplyInput): Promise<void> {
    await this.prismaService.$transaction(
      async tx => {
        const conversation = await tx.conversation.findUnique({
          where: { id: input.conversationId },
          select: { id: true, messageCount: true },
        });

        if (!conversation) {
          throw new NotFoundApiException('会话不存在');
        }

        const messageTimestamp = new Date();
        await tx.conversationMessage.create({
          data: {
            conversationId: input.conversationId,
            role: 'ASSISTANT',
            content: input.content,
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

        await tx.conversation.update({
          where: { id: input.conversationId },
          data: {
            messageCount: conversation.messageCount + 1,
            lastMessageAt: messageTimestamp,
            latestMessagePreview: input.latestMessagePreview,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
