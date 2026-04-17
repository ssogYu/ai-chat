export type ChatSseEventType =
  | 'meta'
  | 'delta'
  | 'reasoning'
  | 'done'
  | 'error';

export interface ChatSseEvent<T = Record<string, unknown>> {
  event: ChatSseEventType;
  data: T;
}
