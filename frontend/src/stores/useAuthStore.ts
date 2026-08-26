import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { loginApi, meApi, signupApi } from "@/lib/api/auth";

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  /** 백엔드 /api/auth/* 가 발급하는 JWT. courses 등 회원 전용 API 호출 시 Authorization 헤더로 실린다. */
  token: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, nickname: string) => Promise<AuthResult>;
  logout: () => void;
  /** 새로고침 후 저장된 토큰이 여전히 유효한지 서버에 확인한다. Providers에서 앱 시작 시 한 번 호출. */
  restoreSession: () => Promise<void>;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      token: null,

      login: async (email, password) => {
        try {
          const { token, user } = await loginApi(email, password);
          set({ isLoggedIn: true, user, token });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: errorMessage(error, "로그인에 실패했어요") };
        }
      },

      signup: async (email, password, nickname) => {
        try {
          const { token, user } = await signupApi(email, password, nickname);
          set({ isLoggedIn: true, user, token });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: errorMessage(error, "회원가입에 실패했어요") };
        }
      },

      logout: () => set({ isLoggedIn: false, user: null, token: null }),

      restoreSession: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const { user } = await meApi(token);
          set({ isLoggedIn: true, user, token });
        } catch {
          // 토큰 만료/위조 등 — 조용히 로그아웃 상태로 되돌린다.
          set({ isLoggedIn: false, user: null, token: null });
        }
      },
    }),
    {
      name: "daejourneyu-auth",
      // 새로고침 시 곧바로 로그인 상태로 보여주고(낙관적), restoreSession이 백그라운드에서
      // 토큰 유효성을 재검증해 필요하면 되돌린다.
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn, user: state.user, token: state.token }),
    }
  )
);
