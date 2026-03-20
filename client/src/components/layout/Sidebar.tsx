"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore, Session } from "@/stores/chatStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

function groupSessionsByDate(sessions: Session[]) {
  const groups: { label: string; sessions: Session[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todaySessions: Session[] = [];
  const weekSessions: Session[] = [];
  const monthSessions: Session[] = [];
  const olderSessions: Session[] = [];

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
  session: Session;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-3 py-2.5 transition-all cursor-pointer",
        isActive
          ? "bg-sidebar-active text-foreground"
          : "text-foreground-muted hover:bg-sidebar-hover hover:text-foreground",
      )}
      onClick={() => !isEditing && onSelect()}
    >
      <Icons.messageSquare className="h-4 w-4 shrink-0 opacity-60" />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-sm">{session.title}</span>
      )}

      <div
        className={cn(
          "flex items-center gap-0.5 transition-opacity",
          isActive || showMenu
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
            setShowMenu(false);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Icons.edit className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Icons.moreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-[120px] animate-scale-in rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icons.edit className="h-3.5 w-3.5" />
            重命名
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Icons.trash className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const {
    sessions,
    currentSessionId,
    isSidebarOpen,
    createSession,
    deleteSession,
    renameSession,
    setCurrentSession,
    setSidebarOpen,
  } = useChatStore();

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

      <div className="p-3">
        <button
          onClick={() => {
            const id = createSession();
            setCurrentSession(id);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98]"
        >
          <Icons.plus className="h-4 w-4" />
          新建对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {groupedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icons.messageSquare className="mb-3 h-10 w-10 text-foreground-muted opacity-40" />
            <p className="text-sm text-foreground-muted">暂无对话记录</p>
            <p className="mt-1 text-xs text-foreground-muted opacity-60">
              点击上方按钮开始新对话
            </p>
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
                      onSelect={() => setCurrentSession(session.id)}
                      onRename={(title) => renameSession(session.id, title)}
                      onDelete={() => deleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
