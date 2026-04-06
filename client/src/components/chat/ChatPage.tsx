"use client";

import { useChatStore } from "@/stores/chatStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icons } from "@/components/ui/Icons";

export function ChatPage() {
  const {
    isSidebarOpen,
    toggleSidebar,
    chatMessage,
    chatLoading,
    chatError,
    clearChatError,
  } = useChatStore();

  const hasMessages = chatMessage.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => toggleSidebar()}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icons.panelLeftOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {chatLoading && (
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-foreground-muted">
                <Icons.loader className="h-4 w-4 animate-spin" />
                <span>正在生成回复</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {chatError && (
              <div className="border-b border-border bg-destructive/10 px-4 py-3">
                <div className="mx-auto flex max-w-4xl items-start justify-between gap-3 rounded-xl border border-destructive/20 bg-background px-4 py-3 text-sm">
                  <div className="flex items-start gap-2 text-foreground">
                    <Icons.alertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{chatError}</span>
                  </div>
                  <button
                    onClick={clearChatError}
                    className="text-foreground-muted transition-colors hover:text-foreground"
                  >
                    <Icons.x className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            {hasMessages ? (
              <>
                <MessageList />
                <ChatInput />
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-4">
                <div className="mb-8 flex flex-col items-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover">
                    <Icons.sparkles className="h-10 w-10 text-accent-foreground" />
                  </div>
                  <h1 className="mb-2 text-2xl font-semibold text-foreground">
                    欢迎使用 AI 助手
                  </h1>
                  <p className="max-w-md text-center text-foreground-muted">
                    开始一段新的对话，探索 AI 的无限可能
                  </p>
                </div>
                <div className="w-full max-w-4xl">
                  <ChatInput showBorder={false} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
