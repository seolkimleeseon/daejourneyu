const AUTHORIZE_ENDPOINT = "https://kauth.kakao.com/oauth/authorize";
const TOKEN_ENDPOINT = "https://kauth.kakao.com/oauth/token";
const PROFILE_ENDPOINT = "https://kapi.kakao.com/v2/user/me";

export interface KakaoProfile {
  /** 카카오 회원번호. 사용자 식별의 기준이다. */
  id: string;
  nickname: string;
  email: string | null;
}

export function assertKakaoConfig(): { restApiKey: string; redirectUri: string } {
  // P2의 카카오 로컬 API와 같은 키를 쓴다 — 로그인은 앱 설정에서 "카카오 로그인"만 추가로 켜면 된다.
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  if (!restApiKey || !redirectUri) {
    throw new Error(
      "KAKAO_REST_API_KEY / KAKAO_REDIRECT_URI가 backend/.env에 설정되지 않았어요 (.env.example 참고)"
    );
  }

  return { restApiKey, redirectUri };
}

export function buildAuthorizeUrl(state: string): string {
  const { restApiKey, redirectUri } = assertKakaoConfig();

  const params = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: redirectUri,
    response_type: "code",
    // scope는 넘기지 않는다. 개발자 콘솔의 "카카오 로그인 > 동의항목"에 설정된 항목이 그대로 쓰인다.
    // 콘솔에 없는 항목을 scope로 요청하면 동의 화면 대신 KOE205 오류가 뜬다(이메일은 비즈앱 전환 전까지
    // 권한이 없는 경우가 많다). 닉네임·이메일 수집 여부는 콘솔에서 켜고 끈다.
    state,
  });

  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

/** 인가 코드를 액세스 토큰으로 교환한다. 이 토큰은 프로필 조회에만 쓰고 저장하지 않는다. */
async function exchangeCodeForToken(code: string): Promise<string> {
  const { restApiKey, redirectUri } = assertKakaoConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: redirectUri,
    code,
  });

  // 앱에 "보안 > Client Secret"을 켠 경우에만 필요하다.
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (clientSecret) body.set("client_secret", clientSecret);

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });

  if (!response.ok) {
    throw new Error(`카카오 토큰 교환 실패 (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("카카오 응답에 access_token이 없습니다");

  return data.access_token;
}

async function fetchProfile(accessToken: string): Promise<KakaoProfile> {
  const response = await fetch(PROFILE_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`카카오 프로필 조회 실패 (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as {
    id: number;
    kakao_account?: {
      email?: string;
      profile?: { nickname?: string };
    };
  };

  return {
    id: String(data.id),
    // 닉네임 동의를 안 받았을 수 있으므로 기본값을 둔다.
    nickname: data.kakao_account?.profile?.nickname?.trim() || "대저니유 이용자",
    email: data.kakao_account?.email ?? null,
  };
}

/** 인가 코드 → 카카오 프로필. 라우터는 이 함수 하나만 쓰면 된다. */
export async function fetchKakaoProfileByCode(code: string): Promise<KakaoProfile> {
  return fetchProfile(await exchangeCodeForToken(code));
}
