"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/lib/utils";
import "./highlight.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={cn("prose prose-sm max-w-4xl dark:prose-invert ", className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeContent = String(children).replace(/\n$/, "");
            if (language) {
              return <CodeBlock code={codeContent} language={language} />;
            }

            return (
              <code
                className={cn(
                  "rounded bg-secondary px-1.5 py-0.5 font-mono text-sm",
                  className,
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-4 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return (
              <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return (
              <h1 className="mb-4 text-2xl font-bold leading-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="mb-3 text-xl font-semibold leading-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="mb-2 text-lg font-semibold leading-tight">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="mb-2 text-base font-semibold leading-tight">
                {children}
              </h4>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="mb-4 border-l-4 border-border pl-4 italic text-foreground-muted">
                {children}
              </blockquote>
            );
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                className="text-accent-foreground underline underline-offset-4 transition-colors hover:text-accent-foreground/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="border-b border-border">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return (
              <tr className="border-b border-border last:border-0">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left font-semibold">{children}</th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 text-foreground-muted">{children}</td>
            );
          },
          hr() {
            return <hr className="my-6 border-border" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
