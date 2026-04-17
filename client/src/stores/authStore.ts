import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
import { authService } from "@/services/auth";

const TOKEN_KEY = "ai_chat_token";

function setTokenCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=2592000; SameSite=Lax`;
  }
}

function removeTokenCookie() {
  if (typeof document !== "undefined") {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  }
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.login({ email, password });
          const token = data.tokens?.accessToken;
          localStorage.setItem(TOKEN_KEY, token);
          setTokenCookie(token);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          console.log("token11", err);
          set({ error: err?.message, isLoading: false });
          throw err;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.register({
            email,
            password,
            name,
          });
          const token = data.tokens?.accessToken;
          localStorage.setItem(TOKEN_KEY, token);
          setTokenCookie(token);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({ error: err?.message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        await authService.logout();
        localStorage.removeItem(TOKEN_KEY);
        removeTokenCookie();
        set({ user: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          removeTokenCookie();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          const { data } = await authService.getMe();
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          localStorage.removeItem(TOKEN_KEY);
          removeTokenCookie();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
