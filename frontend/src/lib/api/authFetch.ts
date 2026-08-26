/** httpOnly 인증 쿠키를 포함해 보내는 회원 전용 API fetch 래퍼. */
export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { ...init, credentials: "include" });
}
