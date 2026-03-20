"use client";

import { useState, useRef, useEffect } from "react";
import { Message, useChatStore } from "@/stores/chatStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
    message: Message;
    onRegenerate?: () => void;
}

function CitationBadge({ citation }: { citation: { id: number; title: string; url: string } }) {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <a
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground no-underline transition-colors hover:bg-accent-hover"
            >
                [{citation.id}]
            </a>
            {showTooltip && (
                <span className="absolute bottom-full left-0 z-50 mb-2 max-w-xs animate-fade-in rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-lg">
                    <span className="font-medium">{citation.title}</span>
                </span>
            )}
        </span>
    );
}

function ThinkingBlock({ content }: { content: string }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-3 overflow-hidden rounded-lg border border-border bg-secondary">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground-muted transition-colors hover:bg-secondary-hover"
            >
                <Icons.sparkles className="h-4 w-4 text-accent-foreground" />
                <span className="flex-1">思考过程</span>
                <Icons.chevronDown
                    className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>
            {isExpanded && (
                <div className="border-t border-border px-3 py-2 text-sm text-foreground-muted">
                    {content}
                </div>
            )}
        </div>
    );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-3 overflow-hidden rounded-lg border border-code-border bg-code-bg">
            <div className="flex items-center justify-between border-b border-code-border px-3 py-2">
                <span className="text-xs font-medium text-foreground-muted">
                    {language || "code"}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
                >
                    {copied ? (
                        <>
                            <Icons.check className="h-3 w-3" />
                            已复制
                        </>
                    ) : (
                        <>
                            <Icons.copy className="h-3 w-3" />
                            复制
                        </>
                    )}
                </button>
            </div>
            <pre className="overflow-x-auto p-3">
                <code className="font-mono text-sm text-foreground">{code}</code>
            </pre>
        </div>
    );
}

function MessageContent({ content }: { content: string }) {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
            {parts.map((part, index) => {
                if (part.startsWith("```")) {
                    const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                    if (match) {
                        return (
                            <CodeBlock
                                key={index}
                                language={match[1]}
                                code={match[2].trim()}
                            />
                        );
                    }
                }
                return (
                    <span key={index} className="whitespace-pre-wrap">
                        {part}
                    </span>
                );
            })}
        </div>
    );
}

function BranchNavigator({ message }: { message: Message }) {
    const { switchBranch } = useChatStore();

    if (message.totalBranches <= 1) return null;

    return (
        <div className="mt-2 flex items-center gap-1 text-xs text-foreground-muted">
            <button
                onClick={() => switchBranch(message.id, "prev")}
                disabled={message.branchIndex <= 1}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-secondary disabled:opacity-30"
            >
                <Icons.chevronLeft className="h-3 w-3" />
            </button>
            <span className="min-w-[40px] text-center">
                {message.branchIndex} / {message.totalBranches}
            </span>
            <button
                onClick={() => switchBranch(message.id, "next")}
                disabled={message.branchIndex >= message.totalBranches}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-secondary disabled:opacity-30"
            >
                <Icons.chevronRight className="h-3 w-3" />
            </button>
        </div>
    );
}

export function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const { deleteMessage, regenerateMessage } = useChatStore();

    const isUser = message.role === "user";

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = () => {
        deleteMessage(message.id);
    };

    const handleRegenerate = () => {
        regenerateMessage(message.id);
        onRegenerate?.();
    };

    return (
        <div
            className={cn(
                "group flex gap-4 py-6",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div
                className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isUser
                        ? "bg-chat-user-bg text-chat-user-fg"
                        : "bg-chat-assistant-bg text-chat-assistant-fg ring-1 ring-border"
                )}
            >
                {isUser ? (
                    <Icons.user className="h-4 w-4" />
                ) : (
                    <Icons.bot className="h-4 w-4" />
                )}
            </div>

            <div className={cn("flex-1", isUser && "flex flex-col items-end")}>
                {message.isThinking && message.thinkingContent && (
                    <ThinkingBlock content={message.thinkingContent} />
                )}

                <div
                    className={cn(
                        "relative max-w-[85%] rounded-2xl px-4 py-3",
                        isUser
                            ? "bg-chat-user-bg text-chat-user-fg"
                            : "bg-chat-assistant-bg text-chat-assistant-foreground"
                    )}
                >
                    {message.isStreaming ? (
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                            </div>
                        </div>
                    ) : (
                        <MessageContent content={message.content} />
                    )}

                    {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {message.citations.map((citation) => (
                                <CitationBadge key={citation.id} citation={citation} />
                            ))}
                        </div>
                    )}
                </div>

                <BranchNavigator message={message} />

                <div
                    className={cn(
                        "mt-2 flex items-center gap-1 transition-opacity",
                        showActions ? "opacity-100" : "opacity-0"
                    )}
                >
                    <button
                        onClick={handleCopy}
                        className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
                    >
                        {copied ? (
                            <>
                                <Icons.check className="h-3 w-3" />
                                已复制
                            </>
                        ) : (
                            <>
                                <Icons.copy className="h-3 w-3" />
                                复制
                            </>
                        )}
                    </button>

                    {!isUser && (
                        <button
                            onClick={handleRegenerate}
                            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
                        >
                            <Icons.refresh className="h-3 w-3" />
                            重新生成
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        className="flex h-7 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <Icons.trash className="h-3 w-3" />
                        删除
                    </button>
                </div>
            </div>
        </div>
    );
}
