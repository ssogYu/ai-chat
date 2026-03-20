"use client";

import { useChatStore } from "@/stores/chatStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ArtifactsPanel } from "@/components/artifacts/ArtifactsPanel";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icons } from "@/components/ui/Icons";

export function ChatPage() {
  const { isSidebarOpen, toggleSidebar, toggleArtifacts } = useChatStore();

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
            {/* todo：模型选择 */}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => toggleArtifacts()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icons.code className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            <MessageList />
            <ChatInput />
          </div>

          <ArtifactsPanel />
        </main>
      </div>
    </div>
  );
}
