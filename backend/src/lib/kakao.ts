// 카카오 로그인(OAuth 2.0 Authorization Code Grant) 연동.
// 순서: /api/auth/kakao/start(인가 페이지로 리다이렉트) → 사용자 동의 →
// 카카오가 KAKAO_REDIRECT_URI로 ?code= 붙여 콜백 → 여기서 code를 토큰으로 교환 → 프로필 조회.

const KAKAO_REDIRECT_URI = "http://localhost:4000/api/auth/kakao/callback";

/** state는 카카오가 콜백에 그대로 되돌려주는 값 — 로그인 시작 전 프론트 경로를 실어 보내서
 * 로그인 완료 후 원래 있던 화면으로 되돌아가는 데 쓴다(OAuth는 전체 페이지 이동이라 리액트 상태가 못 살아남음). */
export function kakaoAuthorizeUrl(state?: string): string {
  const clientId = process.env.KAKAO_REST_API_KEY;
  if (!clientId) throw new Error("KAKAO_REST_API_KEY가 설정되지 않았어요");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: "code",
  });
  if (state) params.set("state", state);
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeKakaoCode(code: string): Promise<string> {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("카카오 키가 설정되지 않았어요");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: KAKAO_REDIRECT_URI,
    code,
  });

  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`카카오 토큰 교환 실패: ${detail}`);
  }
  const data = (await res.json()) as KakaoTokenResponse;
  return data.access_token;
}

export interface KakaoProfile {
  kakaoId: string;
  nickname: string;
  /** 이메일 동의항목을 안 받았거나 카카오 계정에 이메일이 없으면 null. */
  email: string | null;
}

interface KakaoUserMeResponse {
  id: number;
  properties?: { nickname?: string };
  kakao_account?: {
    profile?: { nickname?: string };
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
  };
}

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`카카오 프로필 조회 실패: ${detail}`);
  }
  const data = (await res.json()) as KakaoUserMeResponse;

  const nickname = data.kakao_account?.profile?.nickname ?? data.properties?.nickname ?? "카카오사용자";
  const emailVerified = data.kakao_account?.is_email_valid && data.kakao_account?.is_email_verified;
  const email = emailVerified ? (data.kakao_account?.email ?? null) : null;

  return { kakaoId: String(data.id), nickname, email };
}
