"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import { useChatStore } from "@/stores/chatStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import { LLM_REASONING_EFFORT_VALUES } from "@/types/chat";

interface ChatInputProps {
  showBorder?: boolean;
}

export function ChatInput({ showBorder = true }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    webSearchEnabled,
    attachedFiles,
    toggleWebSearch,
    reasoningEnabled,
    reasoningEffort,
    toggleReasoning,
    setReasoningEffort,
    chatLoading,
    chat,
  } = useChatStore();

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || chatLoading) return;
    try {
      await chat(input);
      setInput("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      setInput("");
      console.error(error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCycleReasoningEffort = () => {
    const cycleValues = LLM_REASONING_EFFORT_VALUES.slice(0, 3);
    const currentIndex = cycleValues.indexOf(reasoningEffort);
    const nextIndex = (currentIndex + 1) % cycleValues.length;
    setReasoningEffort(cycleValues[nextIndex]);
  };

  const reasoningLabelMap = {
    low: "浅度思考",
    medium: "中度思考",
    high: "深度思考",
    max: "极致思考",
  } as const;

  return (
    <div
      className={cn(
        "bg-transparent p-4",
        showBorder && "border-t border-card-border",
      )}
    >
      <div
        className={cn(
          "relative rounded-3xl border bg-input/85 shadow-sm backdrop-blur-md transition-all",
          "border-input-border focus-within:border-input-focus focus-within:shadow-md",
          isDragOver &&
            "border-primary/60 bg-input shadow-md ring-2 ring-primary/15",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (⌘ + Enter 发送)"
          rows={1}
          className="w-full max-h-[200px] min-h-[42px] resize-none bg-transparent px-4 pt-4 pb-2 text-foreground placeholder:text-foreground-muted/90 focus:outline-none"
        />
        <div className="flex justify-between gap-2 p-3 pt-0">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleWebSearch}
              disabled={chatLoading}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
                webSearchEnabled
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground-muted hover:bg-secondary hover:text-foreground",
                chatLoading && "cursor-not-allowed opacity-60",
              )}
              title="联网搜索"
            >
              <Icons.globe className="h-4 w-4" />
              <span className="hidden sm:inline">联网搜索</span>
            </button>
            {/* <button
              onClick={toggleReasoning}
              disabled={chatLoading}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
                reasoningEnabled
                  ? "bg-primary/12 text-primary shadow-sm"
                  : "text-foreground-muted hover:bg-secondary hover:text-foreground",
                chatLoading && "cursor-not-allowed opacity-60",
              )}
              title="展示模型思考过程"
            >
              <Icons.sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">思考过程</span>
            </button> */}
            {/* {reasoningEnabled && (
              <button
                onClick={handleCycleReasoningEffort}
                disabled={chatLoading}
                className={cn(
                  "hidden h-9 items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:flex",
                  chatLoading && "cursor-not-allowed opacity-60",
                )}
                title="切换思考强度"
              >
                <Icons.zap className="h-4 w-4" />
                <span>{reasoningLabelMap[reasoningEffort]}</span>
              </button>
            )} */}
          </div>
          <button
            onClick={handleSubmit}
            disabled={
              (!input.trim() && attachedFiles.length === 0) || chatLoading
            }
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
              (input.trim() || attachedFiles.length > 0) && !chatLoading
                ? "bg-primary text-primary-foreground hover:bg-primary-hover active:scale-95"
                : "bg-secondary text-foreground-muted",
            )}
          >
            {chatLoading ? (
              <Icons.loader className="h-5 w-5 animate-spin" />
            ) : (
              <Icons.send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
