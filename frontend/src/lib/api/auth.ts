import type { User } from "@/types";

/** 필드별 검증 메시지. 서버가 프론트 폼과 같은 규칙으로 다시 검사한 결과다. */
export interface AuthFieldErrors {
  email?: string;
  nickname?: string;
  password?: string;
}

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; message?: string; errors?: AuthFieldErrors };

export interface SignupInput {
  email: string;
  nickname: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * 인증 API 호출. 토큰은 httpOnly 쿠키로 오가므로 프론트가 직접 다루지 않고,
 * credentials만 붙여 브라우저가 쿠키를 싣도록 한다.
 * 경로는 next.config.mjs의 rewrites가 백엔드(:4000)로 프록시한다.
 */
async function requestAuth(path: string, body?: unknown): Promise<AuthResult> {
  let response: Response;

  try {
    response = await fetch(`/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // 백엔드가 꺼져 있으면 fetch 자체가 실패한다 — 사용자에게는 서버 문제로 안내한다.
    return { ok: false, message: "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요" };
  }

  if (response.ok) {
    const data = (await response.json()) as { user: User };
    return { ok: true, user: data.user };
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    errors?: AuthFieldErrors;
  };
  return { ok: false, message: data.error, errors: data.errors };
}

export function signupRequest(input: SignupInput): Promise<AuthResult> {
  return requestAuth("signup", input);
}

export function loginRequest(input: LoginInput): Promise<AuthResult> {
  return requestAuth("login", input);
}

/** 새로고침 후 세션 복구. 쿠키가 없거나 만료면 실패를 그대로 돌려준다. */
export function meRequest(): Promise<AuthResult> {
  return requestAuth("me");
}

export async function logoutRequest(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // 서버에 못 닿아도 클라이언트 세션은 비운다.
  }
}
