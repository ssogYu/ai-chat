export type ChatSseEventType = 'meta' | 'delta' | 'done' | 'error';

export interface ChatSseEvent<T = Record<string, unknown>> {
  event: ChatSseEventType;
  data: T;
}
