import type { User } from "@/types";

interface AuthResponse {
  token: string;
  user: User;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export async function signupApi(email: string, password: string, nickname: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nickname }),
  });
  if (!res.ok) throw new Error(await readError(res, "회원가입에 실패했어요"));
  return res.json();
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res, "로그인에 실패했어요"));
  return res.json();
}

export async function meApi(token: string): Promise<{ user: User }> {
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await readError(res, "세션을 확인하지 못했어요"));
  return res.json();
}
