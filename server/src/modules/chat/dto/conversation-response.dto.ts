import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LLM_PROVIDER_VALUES } from '../../llm/llm.types';
import type { LlmProvider, LlmRole } from '../../llm/llm.types';

const CONVERSATION_STATUS_VALUES = ['active', 'archived'] as const;

export type ConversationStatusValue =
  (typeof CONVERSATION_STATUS_VALUES)[number];

const CHAT_ROLE_VALUES: LlmRole[] = ['system', 'user', 'assistant'];

export class ConversationListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description: '会话标题，默认取首条用户消息摘要',
  })
  title!: string;

  @ApiProperty({
    enum: CONVERSATION_STATUS_VALUES,
    example: 'active',
  })
  status!: ConversationStatusValue;

  @ApiProperty({
    description: '会话内已持久化的消息数量',
    example: 6,
  })
  messageCount!: number;

  @ApiPropertyOptional({
    description: '最近一条消息摘要，适合列表展示',
    example: '请帮我总结一下这次讨论的重点',
  })
  latestMessagePreview?: string | null;

  @ApiProperty({
    description: '最近一条消息时间',
  })
  lastMessageAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ConversationMessageItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    description: '消息顺序，从 1 开始递增',
    example: 1,
  })
  sequence!: number;

  @ApiProperty({
    enum: CHAT_ROLE_VALUES,
    example: 'user',
  })
  role!: LlmRole;

  @ApiProperty({
    description: '消息正文',
  })
  content!: string;

  @ApiPropertyOptional({
    description: '发起本轮请求的 requestId，用于串联流式请求',
  })
  requestId?: string | null;

  @ApiPropertyOptional({
    enum: LLM_PROVIDER_VALUES,
    example: 'openai',
  })
  provider?: LlmProvider | null;

  @ApiPropertyOptional({
    description: '本条 assistant 消息对应的模型名称',
    example: 'gpt-4.1-mini',
  })
  model?: string | null;

  @ApiPropertyOptional({
    description: '采样温度快照',
    example: 0.7,
  })
  temperature?: number | null;

  @ApiPropertyOptional({
    description: '最大输出 token 快照',
    example: 2048,
  })
  maxTokens?: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ConversationDetailDto extends ConversationListItemDto {
  @ApiProperty({
    type: [ConversationMessageItemDto],
  })
  messages!: ConversationMessageItemDto[];
}

export class ConversationPageInfoDto {
  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  pageNo!: number;

  @ApiProperty({
    description: '当前分页请求的 pageSize',
    example: 20,
  })
  pageSize!: number;

  @ApiProperty({
    description: '总记录数',
    example: 128,
  })
  total!: number;

  @ApiProperty({
    description: '总页数',
    example: 7,
  })
  totalPages!: number;

  @ApiProperty({
    description: '是否还有下一页',
    example: true,
  })
  hasNextPage!: boolean;
}

export class ConversationListResponseDto {
  @ApiProperty({
    type: [ConversationListItemDto],
  })
  items!: ConversationListItemDto[];

  @ApiProperty({
    type: ConversationPageInfoDto,
  })
  pageInfo!: ConversationPageInfoDto;
}
