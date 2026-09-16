/**
 * 백엔드 오리진. NEXT_PUBLIC_API_ORIGIN을 설정하면 next.config.mjs의 rewrite 프록시를 거치지
 * 않고 Railway를 브라우저가 직접 호출하게 만드는 스위치인데, **지금은 절대 설정하면 안 된다.**
 * 한때 프록시 홉을 없애 속도를 높이려고 이렇게 배포했었지만, 프론트(Vercel)와 백엔드(Railway)가
 * 다른 오리진이 되면서 인증 쿠키가 Safari(모바일·데스크톱 공통) 기준 "서드파티 쿠키"가 돼
 * ITP에 막혀 로그인이 실패했다(SameSite=None으로 풀어도 소용없음 — Safari는 SameSite와 별개로
 * 서드파티 쿠키를 기본 차단한다). 재측정해보니 리전(싱가포르) 전환 이후로는 프록시 오버헤드도
 * 거의 없어서 얻는 것보다 잃는 게 컸다 — 되돌린 뒤로 env var는 항상 비워 상대경로만 쓴다.
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
