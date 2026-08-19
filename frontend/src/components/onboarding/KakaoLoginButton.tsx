"use client";

interface KakaoLoginButtonProps {
  /** 로그인 후 돌아갈 앱 내부 경로 */
  next?: string | null;
  label?: string;
}

/**
 * 카카오 로그인 시작 버튼.
 * OAuth 리다이렉트 흐름이라 fetch가 아니라 페이지 이동이어야 한다 — 백엔드가 state 쿠키를 심고
 * 카카오 동의 화면으로 보낸 뒤, 콜백에서 세션 쿠키를 발급해 프론트로 되돌려 보낸다.
 */
export function KakaoLoginButton({ next, label = "카카오로 시작하기" }: KakaoLoginButtonProps) {
  const href = next ? `/api/auth/kakao/start?next=${encodeURIComponent(next)}` : "/api/auth/kakao/start";

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
