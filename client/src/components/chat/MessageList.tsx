"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { Icons } from "@/components/ui/Icons";

export function MessageList() {
  const { messages, currentSessionId } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!userScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledRef.current = scrollTop + clientHeight < scrollHeight - 100;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  if (!currentSessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover">
          <Icons.sparkles className="h-10 w-10 text-accent-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          欢迎使用 AI 助手
        </h1>
        <p className="mb-8 max-w-md text-foreground-muted">
          开始一段新的对话，探索 AI
          的无限可能。支持联网搜索、文件上传、代码生成等功能。
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Icons.messageSquare className="mb-4 h-16 w-16 text-foreground-muted opacity-40" />
        <h2 className="mb-2 text-xl font-medium text-foreground">开始新对话</h2>
        <p className="text-foreground-muted">在下方输入框中输入您的问题</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto px-4">
      <div className="mx-auto max-w-3xl py-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
