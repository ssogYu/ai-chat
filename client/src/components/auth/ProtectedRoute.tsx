"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await fetchUser();
      setIsInitializing(false);
    };
    initAuth();
  }, [fetchUser]);

  useEffect(() => {
    if (!isInitializing && !isLoading && !isAuthenticated) {
      const redirectUrl = pathname !== "/" ? pathname : "";
      router.push(
        redirectUrl
          ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
          : "/login",
      );
    }
  }, [isAuthenticated, isLoading, isInitializing, router, pathname]);

  if (isInitializing || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-foreground-muted animate-pulse">
            加载中...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
