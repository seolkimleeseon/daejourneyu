"use client";

import { apiUrl } from "@/lib/api/authFetch";

interface KakaoLoginButtonProps {
  /** 로그인 후 돌아갈 앱 내부 경로 */
  next?: string | null;
  label?: string;
}

/**
 * 카카오 로그인 시작 버튼.
 * OAuth 리다이렉트 흐름이라 fetch가 아니라 페이지 이동이어야 한다 — 백엔드가 state 쿠키를 심고
 * 카카오 동의 화면으로 보낸 뒤, 콜백에서 세션 쿠키를 발급해 프론트로 되돌려 보낸다.
 * apiUrl()로 백엔드(Railway)를 직접 가리켜야 한다 — 다른 API 호출도 전부 직접 호출로 바뀌어서,
 * 여기만 Vercel 프록시(vercel.app 도메인)를 타면 세션 쿠키가 엉뚱한 도메인에 찍혀 로그인 직후
 * "로그인 안 된 상태"로 보이는 문제가 생긴다.
 */
export function KakaoLoginButton({ next, label = "카카오로 시작하기" }: KakaoLoginButtonProps) {
  const path = next ? `/api/auth/kakao/start?next=${encodeURIComponent(next)}` : "/api/auth/kakao/start";
  const href = apiUrl(path);

  return (
    <a
      href={href}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-kakao px-4 text-sm font-bold text-kakao-ink transition-opacity active:opacity-80"
    >
      <span aria-hidden className="text-base">💬</span>
      {label}
    </a>
  );
}
