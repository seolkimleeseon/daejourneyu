/**
 * 백엔드 오리진. 배포 환경(Vercel)에서는 next.config.mjs의 rewrite 프록시를 거치지 않고
 * Railway를 브라우저가 직접 호출한다 — 프록시 홉 하나를 없애 응답 속도를 크게 줄인다.
 * 미설정 시(로컬 개발) 빈 문자열이라 기존처럼 상대경로("/api/...")로 남아 rewrite가 처리한다.
 * 쿠키는 `backend/src/lib/auth.ts`의 setAuthCookie가 프로덕션에서 sameSite:"none"으로 발급해
 * 이 크로스 오리진 호출에서도 인증 쿠키가 실려 간다.
 */
const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";

/** "/api/..." 상대경로를 API_ORIGIN 기준 절대경로로 바꾼다. 이미 절대 URL이면 그대로 둔다. */
export function apiUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}

/** httpOnly 인증 쿠키를 포함해 보내는 회원 전용 API fetch 래퍼. */
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(input), { ...init, credentials: "include" });
}
