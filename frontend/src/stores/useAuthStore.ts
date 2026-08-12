import { create } from "zustand";
import type { User } from "@/types";
import { mockUser } from "@/mocks";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
}

// TODO(api): 로그인/로그아웃을 실제 인증 API 호출로 교체. 지금은 mockUser를 세션인 것처럼 다룬다.
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  login: () => set({ isLoggedIn: true, user: mockUser }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));
