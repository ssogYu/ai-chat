"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/chatStore";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export function ArtifactsPanel() {
  const {
    artifacts,
    activeArtifactId,
    isArtifactsOpen,
    setActiveArtifact,
    removeArtifact,
    toggleArtifacts,
  } = useChatStore();

  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);

  if (!isArtifactsOpen) return null;

  return (
    <aside className="flex h-full w-[480px] flex-col border-l border-border bg-background animate-slide-left">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icons.code className="h-5 w-5 text-foreground-muted" />
          <h2 className="font-semibold text-foreground">Artifacts</h2>
        </div>
        <div className="flex items-center gap-1">
          {artifacts.length > 1 && (
            <div className="mr-2 flex gap-1">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setActiveArtifact(artifact.id)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    artifact.id === activeArtifactId
                      ? "bg-primary"
                      : "bg-border hover:bg-border-hover",
                  )}
                />
              ))}
            </div>
          )}
          <button
            onClick={() => toggleArtifacts()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icons.x className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeArtifact && (
        <>
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {activeArtifact.title}
              </span>
              {activeArtifact.language && (
                <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground-muted">
                  {activeArtifact.language}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                  viewMode === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icons.play className="h-3 w-3" />
                预览
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                  viewMode === "code"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground-muted hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icons.code className="h-3 w-3" />
                代码
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {viewMode === "preview" ? (
              <div className="h-full bg-white">
                <iframe
                  srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                            <head>
                                                <meta charset="utf-8">
                                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                                <script src="https://cdn.tailwindcss.com"></script>
                                                <style>
                                                    body { font-family: 'Outfit', system-ui, sans-serif; }
                                                </style>
                                            </head>
                                            <body class="p-4">
                                                ${activeArtifact.content}
                                            </body>
                                        </html>
                                    `}
                  className="h-full w-full border-0"
                  title={activeArtifact.title}
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="p-4">
                <pre className="overflow-x-auto rounded-lg border border-code-border bg-code-bg p-4">
                  <code className="font-mono text-sm text-foreground">
                    {activeArtifact.content}
                  </code>
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeArtifact.content);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icons.copy className="h-4 w-4" />
                复制
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([activeArtifact.content], {
                    type: "text/plain",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${activeArtifact.title}.${activeArtifact.language || "txt"}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-foreground-muted transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icons.download className="h-4 w-4" />
                下载
              </button>
            </div>
            <button
              onClick={() => removeArtifact(activeArtifact.id)}
              className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Icons.trash className="h-4 w-4" />
              删除
            </button>
          </div>
        </>
      )}

      {!activeArtifact && (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <Icons.code className="mb-4 h-16 w-16 text-foreground-muted opacity-40" />
          <h3 className="mb-2 text-lg font-medium text-foreground">暂无内容</h3>
          <p className="text-sm text-foreground-muted">
            当 AI 生成代码或内容时，将在此处显示
          </p>
        </div>
      )}
    </aside>
  );
}
