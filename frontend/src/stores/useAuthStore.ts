import { create } from "zustand";
import type { User } from "@/types";
import {
  loginRequest,
  logoutRequest,
  meRequest,
  signupRequest,
  type AuthResult,
  type LoginInput,
  type SignupInput,
} from "@/lib/api/auth";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  /** 세션 복구가 끝났는지. 복구 전에는 로그인 게이팅을 섣불리 띄우지 않는다. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signup: (input: SignupInput) => Promise<AuthResult>;
  login: (input: LoginInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

/** 진행 중인 세션 확인. 마운트·포그라운드 복귀가 겹쳐도 /api/auth/me를 한 번만 쏜다. */
let hydrateInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,

  hydrate: () => {
    if (hydrateInFlight) return hydrateInFlight;
    hydrateInFlight = (async () => {
      try {
        const result = await meRequest();
        set(result.ok ? { isLoggedIn: true, user: result.user, hydrated: true } : { hydrated: true });
      } finally {
        hydrateInFlight = null;
      }
    })();
    return hydrateInFlight;
  },

  signup: async (input) => {
    const result = await signupRequest(input);
    if (result.ok) set({ isLoggedIn: true, user: result.user, hydrated: true });
    return result;
  },

  login: async (input) => {
    const result = await loginRequest(input);
    if (result.ok) set({ isLoggedIn: true, user: result.user, hydrated: true });
    return result;
  },

  logout: async () => {
    await logoutRequest();
    set({ isLoggedIn: false, user: null });
  },
}));
