"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Icons } from "./Icons";

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const SunIcon = Icons.sun;
    const MoonIcon = Icons.moon;

    return (
        <button
            onClick={toggleTheme}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-foreground-muted transition-all hover:bg-secondary hover:text-foreground focus-ring"
            aria-label={theme === "light" ? "切换到暗黑模式" : "切换到明亮模式"}
        >
            <SunIcon
                className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
                    theme === "light"
                        ? "rotate-0 scale-100 opacity-100"
                        : "rotate-90 scale-0 opacity-0"
                }`}
            />
            <MoonIcon
                className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
                    theme === "dark"
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-0 opacity-0"
                }`}
            />
        </button>
    );
}
