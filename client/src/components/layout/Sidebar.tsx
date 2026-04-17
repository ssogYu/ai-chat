"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types/chat";

function groupSessionsByDate(sessions: ConversationListItem[]) {
  const groups: { label: string; sessions: ConversationListItem[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todaySessions: ConversationListItem[] = [];
  const weekSessions: ConversationListItem[] = [];
  const monthSessions: ConversationListItem[] = [];
  const olderSessions: ConversationListItem[] = [];

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt);
    if (sessionDate >= today) {
      todaySessions.push(session);
    } else if (sessionDate >= weekAgo) {
      weekSessions.push(session);
    } else if (sessionDate >= monthAgo) {
      monthSessions.push(session);
    } else {
      olderSessions.push(session);
    }
  });

  if (todaySessions.length > 0) {
    groups.push({ label: "今天", sessions: todaySessions });
  }
  if (weekSessions.length > 0) {
    groups.push({ label: "过去 7 天", sessions: weekSessions });
  }
  if (monthSessions.length > 0) {
    groups.push({ label: "过去 30 天", sessions: monthSessions });
  }
  if (olderSessions.length > 0) {
    groups.push({ label: "更早", sessions: olderSessions });
  }

  return groups;
}

interface SessionItemProps {
  session: ConversationListItem;
  isActive: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function SessionItem({
  session,
  isActive,
  disabled = false,
  onSelect,
}: SessionItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "group relative flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-all",
        isActive
          ? "bg-sidebar-active text-foreground"
          : "text-foreground-muted hover:bg-sidebar-hover hover:text-foreground",
        disabled && "cursor-not-allowed opacity-60",
      )}
      onClick={onSelect}
      disabled={disabled}
    >
      <Icons.messageSquare className="h-4 w-4 shrink-0 opacity-60" />
      <span className="flex-1 truncate text-sm">{session.title}</span>
      <span className="shrink-0 text-[11px] text-foreground-muted">
        {session.messageCount}
      </span>
    </button>
  );
}

export function Sidebar() {
  const {
    sessions,
    currentSessionId,
    isSidebarOpen,
    setSidebarOpen,
    selectSession,
    loadMoreSessions,
    isLoadingMoreSessions,
    isLoadingSessions,
    isLoadingConversation,
    sessionsHasNextPage,
    chatLoading,
  } = useChatStore();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const groupedSessions = groupSessionsByDate(sessions);
  if (!isSidebarOpen) return null;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover">
            <Icons.sparkles className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-semibold text-foreground">AI Chat</span>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Icons.panelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 mt-4">
        {isLoadingSessions && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.loader className="mb-3 h-5 w-5 animate-spin text-foreground-muted" />
            <p className="text-sm text-foreground-muted">正在加载会话记录</p>
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.messageSquare className="mb-3 h-10 w-10 text-foreground-muted opacity-40" />
            <p className="text-sm text-foreground-muted">暂无对话记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSessions.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-foreground-muted opacity-60">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.sessions.map((session) => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      disabled={chatLoading || isLoadingConversation}
                      onSelect={() => void selectSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {sessionsHasNextPage && (
              <button
                type="button"
                onClick={() => void loadMoreSessions()}
                disabled={isLoadingMoreSessions}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm text-foreground transition-colors",
                  isLoadingMoreSessions
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-sidebar-hover",
                )}
              >
                {isLoadingMoreSessions ? (
                  <Icons.loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.chevronDown className="h-4 w-4" />
                )}
                加载更多
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || "User"}
                className="h-full w-full rounded-full object-cover"
                width={36}
                height={36}
              />
            ) : (
              <Icons.user className="h-4 w-4 text-accent-foreground" />
            )}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.name || user?.email || "用户"}
            </p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-sidebar-hover hover:text-foreground"
            >
              <Icons.moreHorizontal className="h-4 w-4" />
            </button>
            {showDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-40 rounded-lg border border-sidebar-border bg-sidebar shadow-lg">
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-sidebar-hover hover:text-foreground"
                >
                  <Icons.logout className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
