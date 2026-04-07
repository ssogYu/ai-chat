import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatController],
  providers: [ChatService, ConversationsService],
})
export class ChatModule {}
