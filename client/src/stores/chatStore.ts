import { chatService } from "@/services";
import { chatStreanRequest, LlmMessage } from "@/types/chat";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
export interface RequestMessage {
  role: "user" | "model";
  parts: { text: string }[];
  isThinking?: boolean;
}

export interface Citation {
  id: number;
  url: string;
  title: string;
  snippet: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface Artifact {
  id: string;
  type: "code" | "webview";
  title: string;
  content: string;
  language?: string;
}

interface ChatStore {
  sessions: Session[];
  currentSessionId: string | null;
  message: LlmMessage[];
  chatMessage: LlmMessage[];
  activeMessageId: string | null;
  artifacts: Artifact[];
  activeArtifactId: string | null;
  isArtifactsOpen: boolean;
  isSidebarOpen: boolean;
  webSearchEnabled: boolean;
  attachedFiles: File[];
  chatLoading: boolean;
  chatError: string | null;

  //Actions
  chat: (input: string) => Promise<unknown>;
  clearChatError: () => void;
  toggleArtifacts: () => void;
  setActiveArtifact: (artifactId: string | null) => void;
  removeArtifact: (artifactId: string) => void;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleWebSearch: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;

  addAttachedFile: (file: File) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, getState) => ({
      sessions: [],
      currentSessionId: "session-1",
      message: [],
      chatMessage: [],
      activeMessageId: null,
      artifacts: [],
      activeArtifactId: null,
      isArtifactsOpen: false,
      isSidebarOpen: true,
      webSearchEnabled: false,
      attachedFiles: [],
      chatLoading: false,
      chatError: null,

      chat: async (input: string) => {
        const { message, chatLoading } = getState();
        const trimmedInput = input.trim();

        if (!trimmedInput || chatLoading) {
          return;
        }

        const currentMessage: LlmMessage[] = [
          ...message,
          { role: "user", content: trimmedInput },
        ];
        const requestMessage: chatStreanRequest = {
          provider: "ollama",
          model: "gpt-oss:latest",
          messages: currentMessage,
        };
        let assistantContent = "";

        set({
          message: currentMessage,
          chatMessage: currentMessage,
          chatLoading: true,
          chatError: null,
        });

        try {
          await chatService(requestMessage, (event) => {
            if (event.event === "delta") {
              const text = event.data.text;

              if (typeof text !== "string") {
                return;
              }

              assistantContent += text;

              const assistantMessage: LlmMessage = {
                role: "assistant",
                content: assistantContent,
              };

              set({
                message: [...currentMessage, assistantMessage],
                chatMessage: [...currentMessage, assistantMessage],
              });
            }

            if (event.event === "error") {
              const message =
                typeof event.data.message === "string"
                  ? event.data.message
                  : "流式请求失败";

              throw new Error(message);
            }
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "对话请求失败";

          set({
            chatError: errorMessage,
            message: assistantContent
              ? [
                  ...currentMessage,
                  {
                    role: "assistant",
                    content: assistantContent,
                  },
                ]
              : [
                  ...currentMessage,
                  {
                    role: "assistant",
                    content: `抱歉，${errorMessage}`,
                  },
                ],
            chatMessage: assistantContent
              ? [
                  ...currentMessage,
                  {
                    role: "assistant",
                    content: assistantContent,
                  },
                ]
              : [
                  ...currentMessage,
                  {
                    role: "assistant",
                    content: `抱歉，${errorMessage}`,
                  },
                ],
          });

          throw error;
        } finally {
          set({
            chatLoading: false,
            attachedFiles: [],
          });
        }
      },

      clearChatError: () => {
        set({ chatError: null });
      },

      toggleArtifacts: () => {
        set((state) => ({ isArtifactsOpen: !state.isArtifactsOpen }));
      },

      setActiveArtifact: (artifactId) => {
        set({ activeArtifactId: artifactId });
      },

      removeArtifact: (artifactId) => {
        set((state) => {
          const nextArtifacts = state.artifacts.filter(
            (artifact) => artifact.id !== artifactId,
          );
          const nextActiveArtifactId =
            state.activeArtifactId === artifactId
              ? (nextArtifacts[0]?.id ?? null)
              : state.activeArtifactId;

          return {
            artifacts: nextArtifacts,
            activeArtifactId: nextActiveArtifactId,
            isArtifactsOpen:
              nextArtifacts.length > 0 ? state.isArtifactsOpen : false,
          };
        });
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

      addAttachedFile: (file) => {
        set((state) => ({
          attachedFiles: [...state.attachedFiles, file],
        }));
      },

      removeAttachedFile: (index) => {
        set((state) => ({
          attachedFiles: state.attachedFiles.filter((_, i) => i !== index),
        }));
      },

      clearAttachedFiles: () => {
        set({ attachedFiles: [] });
      },
    }),
    {
      name: "chat-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
        sessions: state.sessions,
        chatMessage: state.chatMessage,
        message: state.message,
      }),
    },
  ),
);
