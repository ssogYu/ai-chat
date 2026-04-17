export const LLM_PROVIDER_VALUES = [
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "ollama",
] as const;

export type LlmProvider = (typeof LLM_PROVIDER_VALUES)[number];
export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

export type ConversationStatus = "active" | "archived";

export type ConversationListItem = {
  id: string;
  title: string;
  status: ConversationStatus;
  messageCount: number;
  latestMessagePreview?: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = LlmMessage & {
  id: string;
  sequence: number;
  requestId?: string | null;
  provider?: LlmProvider | null;
  model?: string | null;
  temperature?: number;
  maxTokens?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationDetail = ConversationListItem & {
  messages: ConversationMessage[];
};

export type ConversationPageInfo = {
  pageNo: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type ConversationListResponse = {
  items: ConversationListItem[];
  pageInfo: ConversationPageInfo;
};

export type ChatStreamRequest = {
  conversationId?: string;
  title?: string;
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: LlmMessage[];
};

export type ChatSseEventType = "meta" | "delta" | "done" | "error";

export type ChatSseEvent = {
  event: ChatSseEventType;
  data: Record<string, unknown>;
};

export type chatStreanRequest = ChatStreamRequest;
