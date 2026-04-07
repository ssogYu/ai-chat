用户发送消息
│
▼
ChatController.stream()
│
▼
ChatService.stream()
│
├─► ConversationsService.prepareConversationForStream()
│ ├─ 无 conversationId → createConversation() [建会话 + 存消息]
│ └─ 有 conversationId → appendMessages() [追加消息]
│
├─► LlmService.streamText() → yield delta tokens
│
└─► ConversationsService.appendAssistantReply() [存 AI 回复]
│
▼
数据库：conversation + conversation_messages 各新增一条记录
