"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icons } from "@/components/ui/Icons";

export function ChatPage() {
  const {
    initialize,
    isSidebarOpen,
    toggleSidebar,
    currentSessionTitle,
    messages,
    chatLoading,
    isLoadingConversation,
    createNewConversation,
  } = useChatStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="mx-4 mt-4 flex h-16 items-center justify-between rounded-2xl border border-card-border bg-card/80 px-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => toggleSidebar()}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icons.panelLeftOpen className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {currentSessionTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={createNewConversation}
              className="hidden items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary sm:flex"
            >
              <Icons.plus className="h-4 w-4" />
              新建会话
            </button>
            {chatLoading && (
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-foreground-muted">
                <Icons.loader className="h-4 w-4 animate-spin" />
                <span>正在生成回复</span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden p-4 pt-3">
          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-card-border bg-card/70 shadow-md backdrop-blur-md">
            {isLoadingConversation ? (
              <div className="flex flex-1 items-center justify-center px-4">
                <div className="flex flex-col items-center gap-3 text-foreground-muted">
                  <Icons.loader className="h-6 w-6 animate-spin" />
                  <p className="text-sm">正在加载会话内容</p>
                </div>
              </div>
            ) : hasMessages ? (
              <>
                <MessageList />
                <ChatInput />
              </>
            ) : (
              <div className="relative flex flex-1 flex-col items-center justify-center px-4">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_22%,rgba(199,226,188,0.3),transparent_22%),radial-gradient(circle_at_80%_30%,rgba(250,219,229,0.32),transparent_24%)]" />
                <div className="relative mb-9 flex flex-col items-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/60 bg-gradient-to-br from-gradient-start to-gradient-end shadow-md">
                    <Icons.sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h1 className="mb-2 text-3xl text-foreground [font-family:var(--font-display)]">
                    欢迎使用 AI 助手
                  </h1>
                  <p className="max-w-md text-center text-foreground-muted">
                    从一条灵感开始，和你一起捕捉春天般轻盈的创意对话
                  </p>
                </div>
                <div className="relative w-full max-w-4xl">
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
