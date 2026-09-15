"use client";

import { apiUrl } from "@/lib/api/authFetch";

interface KakaoLoginButtonProps {
  /** 로그인 후 돌아갈 앱 내부 경로 */
  next?: string | null;
  label?: string;
}

/**
 * 카카오 로그인 시작 버튼.
 *
 * 모양은 카카오 로그인 디자인 가이드를 따른다 — 배경 #FEE500(--color-kakao), 글자·심볼은
 * 검정 85%(--color-kakao-ink), 말풍선 심볼을 라벨 왼쪽에 둔다. 심볼은 이모지(💬)로 대신하면
 * 기기마다 다른 그림이 나오므로 벡터로 직접 그린다. 가이드가 허용하는 문구만 쓴다
 * (기본 "카카오 로그인", 가입 화면은 "카카오로 시작하기" 계열).
 *
 * OAuth 리다이렉트 흐름이라 fetch가 아니라 페이지 이동이어야 한다 — 백엔드가 state 쿠키를 심고
 * 카카오 동의 화면으로 보낸 뒤, 콜백에서 세션 쿠키를 발급해 프론트로 되돌려 보낸다.
 * apiUrl()로 백엔드(Railway)를 직접 가리켜야 한다 — 다른 API 호출도 전부 직접 호출로 바뀌어서,
 * 여기만 Vercel 프록시(vercel.app 도메인)를 타면 세션 쿠키가 엉뚱한 도메인에 찍혀 로그인 직후
 * "로그인 안 된 상태"로 보이는 문제가 생긴다.
 */
export function KakaoLoginButton({ next, label = "카카오 로그인" }: KakaoLoginButtonProps) {
  const path = next ? `/api/auth/kakao/start?next=${encodeURIComponent(next)}` : "/api/auth/kakao/start";
  const href = apiUrl(path);

  return (
    <a
      href={href}
      className="relative flex min-h-12 w-full items-center justify-center rounded-lg bg-kakao px-12 text-sm font-bold text-kakao-ink transition-opacity active:opacity-80"
    >
      {/* 심볼은 가이드대로 라벨 왼쪽에 고정폭으로 둔다 — 라벨과 같이 가운데 정렬하면 문구 길이에
          따라 심볼 위치가 흔들려서, 가입/로그인 화면의 버튼이 서로 어긋나 보인다. */}
      <KakaoSymbol />
      {label}
    </a>
  );
}

/** 카카오 말풍선 심볼. currentColor를 쓰므로 버튼의 글자색(검정 85%)과 항상 같이 움직인다. */
function KakaoSymbol() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 18 18"
      width={18}
      height={18}
      fill="currentColor"
      className="absolute left-4"
    >
      <path d="M9 1C4.3 1 .5 3.99.5 7.68c0 2.35 1.55 4.42 3.89 5.6-.17.6-.62 2.24-.71 2.59-.11.43.16.43.34.31.14-.09 2.24-1.52 3.15-2.14.6.09 1.21.13 1.83.13 4.7 0 8.5-2.99 8.5-6.49C17.5 3.99 13.7 1 9 1Z" />
    </svg>
  );
}
