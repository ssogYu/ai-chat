import { ConversationListItem } from "@/types/chat";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function groupSessionsByDate(sessions: ConversationListItem[]) {
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
