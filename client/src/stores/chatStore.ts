import { create } from "zustand";

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    parentId: string | null;
    branchIndex: number;
    totalBranches: number;
    isStreaming?: boolean;
    isThinking?: boolean;
    thinkingContent?: string;
    citations?: Citation[];
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
    messages: Message[];
    activeMessageId: string | null;
    artifacts: Artifact[];
    activeArtifactId: string | null;
    isArtifactsOpen: boolean;
    isSidebarOpen: boolean;
    webSearchEnabled: boolean;
    attachedFiles: File[];
    
    createSession: () => string;
    deleteSession: (id: string) => void;
    renameSession: (id: string, title: string) => void;
    setCurrentSession: (id: string | null) => void;
    
    addMessage: (message: Omit<Message, "id" | "timestamp" | "branchIndex" | "totalBranches">) => string;
    updateMessage: (id: string, updates: Partial<Message>) => void;
    deleteMessage: (id: string) => void;
    setActiveMessage: (id: string | null) => void;
    switchBranch: (messageId: string, direction: "prev" | "next") => void;
    regenerateMessage: (messageId: string) => void;
    
    addArtifact: (artifact: Omit<Artifact, "id">) => string;
    removeArtifact: (id: string) => void;
    setActiveArtifact: (id: string | null) => void;
    toggleArtifacts: () => void;
    
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleWebSearch: () => void;
    setWebSearchEnabled: (enabled: boolean) => void;
    
    addAttachedFile: (file: File) => void;
    removeAttachedFile: (index: number) => void;
    clearAttachedFiles: () => void;
}

let messageIdCounter = 0;
let sessionIdCounter = 0;
let artifactIdCounter = 0;

export const useChatStore = create<ChatStore>((set, get) => ({
    sessions: [],
    currentSessionId: null,
    messages: [],
    activeMessageId: null,
    artifacts: [],
    activeArtifactId: null,
    isArtifactsOpen: false,
    isSidebarOpen: true,
    webSearchEnabled: false,
    attachedFiles: [],
    
    createSession: () => {
        const id = `session-${++sessionIdCounter}`;
        const newSession: Session = {
            id,
            title: "新对话",
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 0,
        };
        set((state) => ({
            sessions: [newSession, ...state.sessions],
            currentSessionId: id,
            messages: [],
        }));
        return id;
    },
    
    deleteSession: (id) => {
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
            currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
            messages: state.currentSessionId === id ? [] : state.messages,
        }));
    },
    
    renameSession: (id, title) => {
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === id ? { ...s, title, updatedAt: new Date() } : s
            ),
        }));
    },
    
    setCurrentSession: (id) => {
        set({ currentSessionId: id });
    },
    
    addMessage: (message) => {
        const id = `message-${++messageIdCounter}`;
        const newMessage: Message = {
            ...message,
            id,
            timestamp: new Date(),
            branchIndex: 1,
            totalBranches: 1,
        };
        set((state) => {
            const sessions = state.sessions.map((s) =>
                s.id === state.currentSessionId
                    ? { ...s, messageCount: s.messageCount + 1, updatedAt: new Date() }
                    : s
            );
            return {
                messages: [...state.messages, newMessage],
                sessions,
            };
        });
        return id;
    },
    
    updateMessage: (id, updates) => {
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === id ? { ...m, ...updates } : m
            ),
        }));
    },
    
    deleteMessage: (id) => {
        set((state) => ({
            messages: state.messages.filter((m) => m.id !== id && m.parentId !== id),
        }));
    },
    
    setActiveMessage: (id) => {
        set({ activeMessageId: id });
    },
    
    switchBranch: (messageId, direction) => {
        set((state) => ({
            messages: state.messages.map((m) => {
                if (m.id === messageId) {
                    const newIndex =
                        direction === "next"
                            ? Math.min(m.branchIndex + 1, m.totalBranches)
                            : Math.max(m.branchIndex - 1, 1);
                    return { ...m, branchIndex: newIndex };
                }
                return m;
            }),
        }));
    },
    
    regenerateMessage: (messageId) => {
        const message = get().messages.find((m) => m.id === messageId);
        if (message) {
            set((state) => ({
                messages: state.messages.map((m) =>
                    m.id === messageId
                        ? { ...m, totalBranches: m.totalBranches + 1, branchIndex: m.totalBranches + 1 }
                        : m
                ),
            }));
        }
    },
    
    addArtifact: (artifact) => {
        const id = `artifact-${++artifactIdCounter}`;
        const newArtifact: Artifact = { ...artifact, id };
        set((state) => ({
            artifacts: [...state.artifacts, newArtifact],
            activeArtifactId: id,
            isArtifactsOpen: true,
        }));
        return id;
    },
    
    removeArtifact: (id) => {
        set((state) => ({
            artifacts: state.artifacts.filter((a) => a.id !== id),
            activeArtifactId:
                state.activeArtifactId === id ? null : state.activeArtifactId,
        }));
    },
    
    setActiveArtifact: (id) => {
        set({ activeArtifactId: id, isArtifactsOpen: id !== null });
    },
    
    toggleArtifacts: () => {
        set((state) => ({ isArtifactsOpen: !state.isArtifactsOpen }));
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
