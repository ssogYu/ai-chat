"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

export function AuthPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { login, register, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();

  const [mode, setMode] = useState<AuthMode>("login");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const displayError = localError || error;

  const switchMode = useCallback(
    (newMode: AuthMode) => {
      if (newMode === mode || isTransitioning) return;
      setIsTransitioning(true);
      setLocalError(null);
      clearError();
      setTimeout(() => {
        setMode(newMode);
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setIsTransitioning(false);
      }, 200);
    },
    [mode, isTransitioning, clearError],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setLocalError("两次输入的密码不一致");
      return;
    }

    if (!isLogin && formData.password.length < 8) {
      setLocalError("密码至少需要 8 个字符");
      return;
    }

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        router.push("/");
      } else {
        await register(
          formData.email,
          formData.password,
          formData.name || undefined,
        );
        router.push("/");
      }
    } catch {
      /* error is handled by store */
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <div
        className={cn(
          "pointer-events-none fixed inset-0 transition-opacity duration-700",
          theme === "dark" ? "opacity-100" : "opacity-60",
        )}
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 80% 60% at 10% 40%, rgba(254,243,199,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(253,230,138,0.04) 0%, transparent 50%)"
              : "radial-gradient(ellipse 80% 60% at 10% 40%, rgba(254,243,199,0.4) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(253,230,138,0.25) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 flex w-full">
        <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 xl:p-16">
          <div
            className="animate-fade-in"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Icons.sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                AI Chat
              </span>
            </div>
          </div>

          <div
            className="space-y-8 animate-fade-in"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
                {isLogin ? (
                  <>
                    欢迎回来
                    <span className="block text-foreground-muted font-light mt-2">
                      继续你的对话之旅
                    </span>
                  </>
                ) : (
                  <>
                    开始探索
                    <span className="block text-foreground-muted font-light mt-2">
                      开启智能对话新体验
                    </span>
                  </>
                )}
              </h1>
            </div>

            <div className="flex items-center gap-6 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                <span>多模型支持</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                <span>联网搜索</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                <span>代码生成</span>
              </div>
            </div>
          </div>

          <div
            className="animate-fade-in"
            style={{ animationDelay: "500ms", animationFillMode: "both" }}
          >
            <p className="text-xs text-foreground-muted/60">
              &copy; 2026 AI Chat. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-[380px]">
            <div className="flex items-center justify-between mb-10 lg:hidden animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Icons.sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-base font-semibold tracking-tight">
                  AI Chat
                </span>
              </div>
              <ThemeToggle />
            </div>

            <div
              className={cn(
                "transition-all duration-200",
                isTransitioning
                  ? "opacity-0 translate-y-1"
                  : "opacity-100 translate-y-0",
              )}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {isLogin ? "登录" : "创建账号"}
                </h2>
                <p className="mt-2 text-sm text-foreground-muted">
                  {isLogin
                    ? "输入你的账号信息以继续"
                    : "填写以下信息注册新账号"}
                </p>
              </div>

              {displayError && (
                <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-scale-in">
                  <Icons.alertCircle className="h-4 w-4 shrink-0" />
                  <span>{displayError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div
                    className="animate-slide-up"
                    style={{
                      animationDelay: "50ms",
                      animationFillMode: "both",
                    }}
                  >
                    <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                      用户名
                    </label>
                    <div className="relative">
                      <Icons.user className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/50" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="你的用户名"
                        className="w-full h-11 rounded-lg border border-input-border bg-input pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted/40 transition-all duration-200 focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>
                )}

                <div
                  className="animate-slide-up"
                  style={{
                    animationDelay: isLogin ? "50ms" : "100ms",
                    animationFillMode: "both",
                  }}
                >
                  <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                    邮箱
                  </label>
                  <div className="relative">
                    <Icons.globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/50" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 rounded-lg border border-input-border bg-input pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted/40 transition-all duration-200 focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-ring/20"
                      required
                    />
                  </div>
                </div>

                <div
                  className="animate-slide-up"
                  style={{
                    animationDelay: isLogin ? "100ms" : "150ms",
                    animationFillMode: "both",
                  }}
                >
                  <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                    密码
                  </label>
                  <div className="relative">
                    <Icons.zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder={
                        isLogin
                          ? "输入密码"
                          : "至少 8 位，需包含大小写字母和数字"
                      }
                      className="w-full h-11 rounded-lg border border-input-border bg-input pl-10 pr-11 text-sm text-foreground placeholder:text-foreground-muted/40 transition-all duration-200 focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-ring/20"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted/50 hover:text-foreground-muted transition-colors"
                    >
                      {showPassword ? (
                        <Icons.eyeOff className="h-4 w-4" />
                      ) : (
                        <Icons.eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div
                    className="animate-slide-up"
                    style={{
                      animationDelay: "200ms",
                      animationFillMode: "both",
                    }}
                  >
                    <label className="block text-xs font-medium text-foreground-muted mb-2 uppercase tracking-wider">
                      确认密码
                    </label>
                    <div className="relative">
                      <Icons.zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/50" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          updateField("confirmPassword", e.target.value)
                        }
                        placeholder="再次输入密码"
                        className="w-full h-11 rounded-lg border border-input-border bg-input pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted/40 transition-all duration-200 focus:outline-none focus:border-input-focus focus:ring-2 focus:ring-ring/20"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div
                    className="flex items-center justify-between animate-slide-up"
                    style={{
                      animationDelay: "150ms",
                      animationFillMode: "both",
                    }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex h-4 w-4 items-center justify-center">
                        <input type="checkbox" className="peer sr-only" />
                        <div className="h-4 w-4 rounded border border-input-border bg-input transition-all peer-checked:bg-primary peer-checked:border-primary" />
                        <Icons.check className="absolute h-2.5 w-2.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <span className="text-xs text-foreground-muted group-hover:text-foreground transition-colors">
                        记住我
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                    >
                      忘记密码？
                    </button>
                  </div>
                )}

                <div
                  className="animate-slide-up"
                  style={{
                    animationDelay: isLogin ? "200ms" : "250ms",
                    animationFillMode: "both",
                  }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full h-11 rounded-lg text-sm font-medium overflow-hidden transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                  >
                    <span
                      className={cn(
                        "transition-opacity duration-200",
                        isLoading ? "opacity-0" : "opacity-100",
                      )}
                    >
                      {isLogin ? "登录" : "创建账号"}
                    </span>
                    {isLoading && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Icons.loader className="h-4 w-4 animate-spin" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              <div
                className="mt-8 animate-slide-up"
                style={{
                  animationDelay: isLogin ? "300ms" : "350ms",
                  animationFillMode: "both",
                }}
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-foreground-muted">
                      或
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-input-border bg-input text-sm text-foreground-muted transition-all duration-200 hover:bg-secondary hover:text-foreground hover:border-border-hover"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-input-border bg-input text-sm text-foreground-muted transition-all duration-200 hover:bg-secondary hover:text-foreground hover:border-border-hover"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                </div>
              </div>

              <div
                className="mt-8 text-center animate-slide-up"
                style={{
                  animationDelay: isLogin ? "400ms" : "450ms",
                  animationFillMode: "both",
                }}
              >
                <p className="text-sm text-foreground-muted">
                  {isLogin ? "还没有账号？" : "已有账号？"}
                  <button
                    type="button"
                    onClick={() => switchMode(isLogin ? "register" : "login")}
                    className="ml-1.5 font-medium text-foreground hover:text-accent-foreground transition-colors duration-200"
                  >
                    {isLogin ? "立即注册" : "去登录"}
                  </button>
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-end mt-12">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
