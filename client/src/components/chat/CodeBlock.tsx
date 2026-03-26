"use client";

import { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import scala from "highlight.js/lib/languages/scala";
import html from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import bash from "highlight.js/lib/languages/bash";
import shell from "highlight.js/lib/languages/shell";
import sql from "highlight.js/lib/languages/sql";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import nginx from "highlight.js/lib/languages/nginx";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c++", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("c#", csharp);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("rs", rust);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rb", ruby);
hljs.registerLanguage("swift", swift);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("kt", kotlin);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("html", html);
hljs.registerLanguage("xml", html);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("sh", shell);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("dockerfile", dockerfile);
hljs.registerLanguage("docker", dockerfile);
hljs.registerLanguage("nginx", nginx);

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlightedCode = useMemo(() => {
    if (!code) return "";
    try {
      const result = hljs.highlight(code, {
        language: language || "plaintext",
        ignoreIllegals: true,
      });
      return result.value;
    } catch (error) {
      return code;
    }
  }, [code, language]);

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
        <code
          className={`language-${language || "plaintext"} font-mono text-sm`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}
