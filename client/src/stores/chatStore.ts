import { chatService, chatSSEService } from "@/services";
import type {
  ChatStreamRequest,
  ConversationDetail,
  ConversationListItem,
  LlmMessage,
  LlmReasoningEffort,
} from "@/types/chat";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Artifact {
  id: string;
  type: "code" | "webview";
  title: string;
  content: string;
  language?: string;
}

interface ChatStore {
  sessions: ConversationListItem[];
  currentSessionId: string | null;
  currentSessionTitle: string;
  messages: LlmMessage[];
  activeMessageId: string | null;
  isSidebarOpen: boolean;
  webSearchEnabled: boolean;
  reasoningEnabled: boolean;
  reasoningEffort: LlmReasoningEffort;
  attachedFiles: File[];
  hasInitialized: boolean;
  isInitializing: boolean;
  isLoadingSessions: boolean;
  isLoadingMoreSessions: boolean;
  isLoadingConversation: boolean;
  sessionsPageNo: number;
  sessionsPageSize: number;
  sessionsHasNextPage: boolean;
  sessionsTotal: number;
  chatLoading: boolean;

  initialize: () => Promise<void>;
  loadMoreSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  createNewConversation: () => void;
  chat: (input: string) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleWebSearch: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;
  toggleReasoning: () => void;
  setReasoningEffort: (effort: LlmReasoningEffort) => void;
}

const DEFAULT_PAGE_SIZE = 20;

function buildConversationTitle(input: string) {
  const normalized = input.replace(/\s+/g, " ").trim();

  if (normalized.length <= 40) {
    return normalized;
  }

  return `${normalized.slice(0, 39).trimEnd()}…`;
}

function toMessageList(detail: ConversationDetail): LlmMessage[] {
  return detail.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function upsertSession(
  sessions: ConversationListItem[],
  session: ConversationListItem,
) {
  const nextSessions = [
    session,
    ...sessions.filter((item) => item.id !== session.id),
  ];
  nextSessions.sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
  return nextSessions;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, getState) => ({
      // 会话列表
      sessions: [],
      sessionsPageNo: 0,
      sessionsPageSize: DEFAULT_PAGE_SIZE,
      sessionsHasNextPage: false,
      sessionsTotal: 0,

      // 当前会话
      currentSessionId: null,
      currentSessionTitle: "新对话",

      // 当前对话消息记录列表
      messages: [],
      activeMessageId: null,
      activeArtifactId: null,
      isSidebarOpen: true,

      webSearchEnabled: false,
      reasoningEnabled: true,
      reasoningEffort: "medium",
      attachedFiles: [],
      hasInitialized: false,
      isInitializing: false,
      isLoadingSessions: false,
      isLoadingMoreSessions: false,
      isLoadingConversation: false,
      chatLoading: false,

      initialize: async () => {
        const {
          hasInitialized,
          isInitializing,
          currentSessionId,
          sessionsPageSize,
        } = getState();

        if (hasInitialized || isInitializing) {
          return;
        }

        set({
          isInitializing: true,
          isLoadingSessions: true,
        });

        try {
          const { data: response } = await chatService.fetchConversationList(
            1,
            sessionsPageSize,
          );

          set({
            sessions: response.items,
            sessionsPageNo: response.pageInfo.pageNo,
            sessionsPageSize: response.pageInfo.pageSize,
            sessionsHasNextPage: response.pageInfo.hasNextPage,
            sessionsTotal: response.pageInfo.total,
            hasInitialized: true,
            isInitializing: false,
            isLoadingSessions: false,
          });

          //缓存里面取currentSessionId
          if (currentSessionId) {
            await getState().selectSession(currentSessionId);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "加载会话列表失败";
          set({
            hasInitialized: true,
            isInitializing: false,
            isLoadingSessions: false,
          });
          //TODO toast
        }
      },

      loadMoreSessions: async () => {
        const {
          isLoadingMoreSessions,
          sessionsHasNextPage,
          sessionsPageNo,
          sessionsPageSize,
        } = getState();

        if (isLoadingMoreSessions || !sessionsHasNextPage) {
          return;
        }

        set({ isLoadingMoreSessions: true });

        try {
          const nextPageNo = sessionsPageNo + 1;
          const { data: response } = await chatService.fetchConversationList(
            nextPageNo,
            sessionsPageSize,
          );

          set((state) => ({
            sessions: [
              ...state.sessions,
              ...response.items.filter(
                (item) =>
                  !state.sessions.some((session) => session.id === item.id),
              ),
            ],
            sessionsPageNo: response.pageInfo.pageNo,
            sessionsPageSize: response.pageInfo.pageSize,
            sessionsHasNextPage: response.pageInfo.hasNextPage,
            sessionsTotal: response.pageInfo.total,
            isLoadingMoreSessions: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "加载更多会话失败";
          set({
            isLoadingMoreSessions: false,
          });
          //TODO toast
        }
      },

      selectSession: async (sessionId: string) => {
        const { isLoadingConversation, chatLoading } = getState();

        if (!sessionId || isLoadingConversation || chatLoading) {
          return;
        }

        set({
          currentSessionId: sessionId,
          isLoadingConversation: true,
        });

        try {
          const { data: detail } =
            await chatService.fetchConversationDetail(sessionId);

          set((state) => ({
            currentSessionId: detail.id,
            currentSessionTitle: detail.title,
            messages: toMessageList(detail),
            sessions: upsertSession(state.sessions, {
              id: detail.id,
              title: detail.title,
              status: detail.status,
              messageCount: detail.messageCount,
              latestMessagePreview: detail.latestMessagePreview,
              lastMessageAt: detail.lastMessageAt,
              createdAt: detail.createdAt,
              updatedAt: detail.updatedAt,
            }),
            isLoadingConversation: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "加载会话详情失败";
          set({
            isLoadingConversation: false,
          });
          //TODO toast
        }
      },

      createNewConversation: () => {
        set({
          currentSessionId: null,
          currentSessionTitle: "新对话",
          messages: [],
          activeMessageId: null,
        });
      },

      chat: async (input: string) => {
        const {
          messages,
          chatLoading,
          currentSessionId,
          currentSessionTitle,
          reasoningEnabled,
          reasoningEffort,
        } = getState();
        const trimmedInput = input.trim();

        if (!trimmedInput || chatLoading) {
          return;
        }

        const nextMessages: LlmMessage[] = [
          ...messages,
          { role: "user", content: trimmedInput },
        ];
        const requestMessage: ChatStreamRequest = {
          conversationId: currentSessionId ?? undefined,
          title:
            currentSessionId || currentSessionTitle !== "新对话"
              ? undefined
              : buildConversationTitle(trimmedInput),
          provider: "ollama",
          model: "gpt-oss:latest",
          reasoning: {
            enabled: reasoningEnabled,
            effort: reasoningEffort,
          },
          messages: nextMessages,
        };
        let assistantContent = "";
        let assistantThinkingContent = "";
        let resolvedConversationId = currentSessionId;
        const optimisticTitle =
          currentSessionId === null
            ? buildConversationTitle(trimmedInput)
            : currentSessionTitle;

        set({
          currentSessionTitle: optimisticTitle,
          messages: nextMessages,
          chatLoading: true,
        });

        try {
          await chatSSEService.streamConversation(requestMessage, (event) => {
            if (event.event === "meta") {
              const conversationId = event.data.conversationId;

              if (typeof conversationId === "string") {
                resolvedConversationId = conversationId;
                set((state) => ({
                  currentSessionId: conversationId,
                  sessions: upsertSession(state.sessions, {
                    id: conversationId,
                    title: optimisticTitle,
                    status: "active",
                    messageCount: nextMessages.length,
                    latestMessagePreview: trimmedInput,
                    lastMessageAt: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }),
                }));
              }
            }

            if (event.event === "delta") {
              const text = event.data.text;

              if (typeof text !== "string") {
                return;
              }

              assistantContent += text;

              const assistantMessage: LlmMessage = {
                role: "assistant",
                content: assistantContent,
                thinkingContent: assistantThinkingContent || undefined,
              };

              set({
                messages: [...nextMessages, assistantMessage],
              });
            }

            if (event.event === "reasoning") {
              const text = event.data.text;

              if (typeof text !== "string") {
                return;
              }

              assistantThinkingContent += text;

              set({
                messages: [
                  ...nextMessages,
                  {
                    role: "assistant",
                    content: assistantContent,
                    thinkingContent: assistantThinkingContent,
                  },
                ],
              });
            }

            if (event.event === "error") {
              const errorMessage =
                typeof event.data.message === "string"
                  ? event.data.message
                  : "流式请求失败";

              throw new Error(errorMessage);
            }
          });

          if (resolvedConversationId) {
            const { data: detail } = await chatService.fetchConversationDetail(
              resolvedConversationId,
            );

            set((state) => ({
              currentSessionId: detail.id,
              currentSessionTitle: detail.title,
              messages: toMessageList(detail),
              sessions: upsertSession(state.sessions, {
                id: detail.id,
                title: detail.title,
                status: detail.status,
                messageCount: detail.messageCount,
                latestMessagePreview: detail.latestMessagePreview,
                lastMessageAt: detail.lastMessageAt,
                createdAt: detail.createdAt,
                updatedAt: detail.updatedAt,
              }),
            }));
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "对话请求失败";
          //TODO toast

          set({
            messages: assistantContent
              ? [
                  ...nextMessages,
                  {
                    role: "assistant",
                    content: assistantContent,
                    thinkingContent: assistantThinkingContent || undefined,
                  },
                ]
              : [
                  ...nextMessages,
                  {
                    role: "assistant",
                    content: `抱歉，${errorMessage}`,
                  },
                ],
          });

          if (resolvedConversationId) {
            try {
              const { data: detail } =
                await chatService.fetchConversationDetail(
                  resolvedConversationId,
                );
              set((state) => ({
                currentSessionId: detail.id,
                currentSessionTitle: detail.title,
                messages: toMessageList(detail),
                sessions: upsertSession(state.sessions, {
                  id: detail.id,
                  title: detail.title,
                  status: detail.status,
                  messageCount: detail.messageCount,
                  latestMessagePreview: detail.latestMessagePreview,
                  lastMessageAt: detail.lastMessageAt,
                  createdAt: detail.createdAt,
                  updatedAt: detail.updatedAt,
                }),
              }));
            } catch {}
          }

          throw error;
        } finally {
          set({
            chatLoading: false,
            attachedFiles: [],
          });
        }
      },

      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ isSidebarOpen: open });
      },

      toggleWebSearch: () => {
        set((state) => ({ webSearchEnabled: !state.webSearchEnabled }));
      },

      setWebSearchEnabled: (enabled) => {
        set({ webSearchEnabled: enabled });
      },

      toggleReasoning: () => {
        set((state) => ({ reasoningEnabled: !state.reasoningEnabled }));
      },

      setReasoningEffort: (effort) => {
        set({ reasoningEffort: effort });
      },
    }),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        isSidebarOpen: state.isSidebarOpen,
        webSearchEnabled: state.webSearchEnabled,
        reasoningEnabled: state.reasoningEnabled,
        reasoningEffort: state.reasoningEffort,
      }),
    },
  ),
);
