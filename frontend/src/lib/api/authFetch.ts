import { useAuthStore } from "@/stores/useAuthStore";

/** 로그인 토큰을 Authorization 헤더에 자동으로 실어 보내는 fetch 래퍼. 회원 전용 API(코스 등)에서 공용으로 쓴다. */
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
