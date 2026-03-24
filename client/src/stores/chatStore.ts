import { fetchStream } from "@unifying/core";
import { create } from "zustand";

// export interface Message {
//     id: string;
//     role: "user" | "assistant" | "system";
//     content: string;
//     timestamp: Date;
//     parentId: string | null;
//     branchIndex: number;
//     totalBranches: number;
//     isStreaming?: boolean;
//     isThinking?: boolean;
//     thinkingContent?: string;
//     citations?: Citation[];
// }
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
  requestMessages: RequestMessage[];
  activeMessageId: string | null;
  artifacts: Artifact[];
  activeArtifactId: string | null;
  isArtifactsOpen: boolean;
  isSidebarOpen: boolean;
  webSearchEnabled: boolean;
  attachedFiles: File[];

  chat: (input: string) => Promise<unknown>;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleWebSearch: () => void;
  setWebSearchEnabled: (enabled: boolean) => void;

  addAttachedFile: (file: File) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
}

const mockSessions: Session[] = [
  {
    id: "session-1",
    title: "示例对话 1",
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 2,
  },
  {
    id: "session-2",
    title: "示例对话 2",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
    messageCount: 3,
  },
];

export const useChatStore = create<ChatStore>((set, getState) => ({
  sessions: mockSessions,
  currentSessionId: "session-1",
  requestMessages: [],
  activeMessageId: null,
  artifacts: [],
  activeArtifactId: null,
  isArtifactsOpen: false,
  isSidebarOpen: true,
  webSearchEnabled: false,
  attachedFiles: [],

  chat: async (input: string) => {
    const { requestMessages } = getState();
    const messages: RequestMessage[] = [
      ...requestMessages,
      { role: "user", parts: [{ text: input }] },
    ];
    set({
      requestMessages: [...messages],
    });
    let answer: string = "";
    const stream = await fetchStream(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=AIzaSyBuAcbmY24OOxcUTROcc6zPHcAxOjfJFcc&alt=sse",
      {
        method: "POST",
        body: JSON.stringify({
          contents: messages,
        }),
        model: "google",
        onMessage: (data) => {
          if (data.type == "content") {
            answer = answer + data.text;
            set({
              requestMessages: [
                ...messages,
                { role: "model", parts: [{ text: answer }] },
              ],
            });
          }
        },
        onEnd: () => {},
      },
    );
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
}));
