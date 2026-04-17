"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  DragEvent,
  ChangeEvent,
} from "react";
import { useChatStore } from "@/stores/chatStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  showBorder?: boolean;
}

export function ChatInput({ showBorder = true }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    webSearchEnabled,
    attachedFiles,
    toggleWebSearch,
    addAttachedFile,
    removeAttachedFile,
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

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        addAttachedFile(file);
      }
    });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      addAttachedFile(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Icons.image;
    if (file.type === "application/pdf") return Icons.fileText;
    return Icons.fileText;
  };

  return (
    <div
      className={cn(
        "bg-transparent p-4",
        showBorder && "border-t border-card-border",
      )}
    >
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => {
            const FileIcon = getFileIcon(file);
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary/85 px-3 py-2 text-sm shadow-sm"
              >
                <FileIcon className="h-4 w-4 text-foreground-muted" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachedFile(index)}
                  className="ml-1 text-foreground-muted transition-colors hover:text-destructive"
                >
                  <Icons.x className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-3xl border bg-input/85 shadow-sm backdrop-blur-md transition-all",
          isDragOver
            ? "border-accent bg-accent/10"
            : "border-input-border focus-within:border-input-focus focus-within:shadow-md",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl border-2 border-dashed border-accent bg-accent/10">
            <div className="flex items-center gap-2 text-accent-foreground">
              <Icons.paperclip className="h-5 w-5" />
              <span className="font-medium">释放文件以上传</span>
            </div>
          </div>
        )}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              title="上传文件"
            >
              <Icons.paperclip className="h-5 w-5" />
            </button>

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
          </div>
          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && attachedFiles.length === 0) || chatLoading}
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
