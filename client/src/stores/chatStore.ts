import { chatService } from "@/services";
import { UnifiedChatRequest, UnifiedMessage } from "@/types";
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
  message: UnifiedMessage[];
  chatMessage: UnifiedMessage[];
  activeMessageId: string | null;
  artifacts: Artifact[];
  activeArtifactId: string | null;
  isArtifactsOpen: boolean;
  isSidebarOpen: boolean;
  webSearchEnabled: boolean;
  attachedFiles: File[];
  chatLoading: boolean;

  chat: (input: string) => Promise<unknown>;

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

      chat: async (input: string) => {
        const { message } = getState();
        const requestMessage: UnifiedMessage[] = [
          ...message,
          { role: "user", content: input },
        ];
        set({ message: requestMessage });
        const requestMessge: UnifiedChatRequest = {
          model: "openai/gpt-oss-20b",
          messages: requestMessage,
          stream: true,
          reasoning: {
            enabled: true,
            effort: "high",
          },
        };
        let content = "";
        let thinkingContent = "";
        const stream = await chatService(requestMessge, "openai", (data) => {
          if (data?.type === "content") {
            content += data.text;
            set({
              message: [
                ...requestMessage,
                { role: "assistant", content: content },
              ],
              chatMessage: [
                ...requestMessage,
                {
                  role: "assistant",
                  content: content,
                  isThinking: false,
                  thinkingContent,
                },
              ],
            });
          }
          if (data?.type === "thinking") {
            thinkingContent += data.text;
            set({
              chatMessage: [
                ...requestMessage,
                {
                  role: "assistant",
                  content: content,
                  isThinking: true,
                  thinkingContent,
                },
              ],
            });
          }
        });
        return stream;
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
        chatMessage: state.message,
        message: state.message,
      }),
    },
  ),
);
