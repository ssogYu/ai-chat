import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LLM_PROVIDER_VALUES } from '../../llm/llm.types';
import type { LlmProvider, LlmRole } from '../../llm/llm.types';

const LLM_ROLE_VALUES: LlmRole[] = ['system', 'user', 'assistant'];

export class ChatMessageDto {
  @ApiProperty({
    enum: LLM_ROLE_VALUES,
    description: '消息角色',
    example: 'user',
  })
  @IsEnum(LLM_ROLE_VALUES)
  role!: LlmRole;

  @ApiProperty({
    description: '消息内容',
    example: '请介绍一下 NestJS 的模块化设计',
  })
  @IsString()
  content!: string;
}

export class ChatStreamDto {
  @ApiPropertyOptional({
    enum: LLM_PROVIDER_VALUES,
    description: '模型厂商，不传则使用后端默认厂商',
    example: 'openai',
  })
  @IsOptional()
  @IsEnum(LLM_PROVIDER_VALUES)
  provider?: LlmProvider;

  @ApiPropertyOptional({
    description: '模型名称，不传则使用后端按厂商映射的默认模型',
    example: 'gpt-4.1-mini',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: '采样温度，推荐 0~1',
    minimum: 0,
    maximum: 2,
    example: 0.7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: '最大输出 token 数',
    minimum: 1,
    maximum: 32000,
    example: 2048,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(32000)
  maxTokens?: number;

  @ApiProperty({
    type: [ChatMessageDto],
    description: '完整上下文消息列表',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}
