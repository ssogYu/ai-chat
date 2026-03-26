"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const { chatMessage } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!userScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessage]);

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

  if (chatMessage.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-4 overflow-x-hidden"
    >
      <div className="mx-auto max-w-4xl py-6">
        {chatMessage.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
