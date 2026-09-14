import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KakaoApiError,
  KakaoConfigError,
  assertKakaoConfig,
  buildAuthorizeUrl,
  fetchKakaoProfileByCode,
} from "./kakao";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.KAKAO_REST_API_KEY = "rest-key";
  process.env.KAKAO_REDIRECT_URI = "http://localhost:4000/api/auth/kakao/callback";
  delete process.env.KAKAO_CLIENT_SECRET;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 토큰 교환 → 프로필 조회 순서로 두 번 부른다. */
function mockKakaoFlow(profile: unknown) {
  fetchMock
    .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
    .mockResolvedValueOnce(jsonResponse(profile));
}

describe("assertKakaoConfig", () => {
  it("키가 둘 다 있으면 그대로 돌려준다", () => {
    expect(assertKakaoConfig()).toEqual({
      restApiKey: "rest-key",
      redirectUri: "http://localhost:4000/api/auth/kakao/callback",
    });
  });

  it.each(["KAKAO_REST_API_KEY", "KAKAO_REDIRECT_URI"])("%s가 없으면 설정 오류로 구분한다", (key) => {
    delete process.env[key];

    expect(() => assertKakaoConfig()).toThrow(KakaoConfigError);
    // 사용자가 재시도해도 소용없는 오류라 KakaoApiError와 섞이면 안 된다.
    expect(() => assertKakaoConfig()).toThrow(/backend\/.env/);
  });
});

describe("buildAuthorizeUrl", () => {
  it("카카오 인가 엔드포인트로 필요한 파라미터를 붙인다", () => {
    const url = new URL(buildAuthorizeUrl("state-1"));

    expect(url.origin + url.pathname).toBe("https://kauth.kakao.com/oauth/authorize");
    expect(url.searchParams.get("client_id")).toBe("rest-key");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:4000/api/auth/kakao/callback"
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-1");
  });

  it("scope는 넘기지 않는다 — 콘솔에 없는 항목을 요청하면 KOE205로 막힌다", () => {
    const url = new URL(buildAuthorizeUrl("state-1"));

    expect(url.searchParams.has("scope")).toBe(false);
  });

  it("설정이 없으면 URL을 만들지 않고 설정 오류를 던진다", () => {
    delete process.env.KAKAO_REST_API_KEY;

    expect(() => buildAuthorizeUrl("state-1")).toThrow(KakaoConfigError);
  });
});

describe("fetchKakaoProfileByCode", () => {
  it("인가 코드를 토큰으로 바꾼 뒤 프로필을 가져온다", async () => {
    mockKakaoFlow({
      id: 9876,
      kakao_account: { email: "kong@example.com", profile: { nickname: "콩이네" } },
    });

    const profile = await fetchKakaoProfileByCode("auth-code");

    expect(profile).toEqual({ id: "9876", nickname: "콩이네", email: "kong@example.com" });
  });

  it("토큰 교환은 폼 인코딩으로 POST한다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "닉" } } });

    await fetchKakaoProfileByCode("auth-code");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://kauth.kakao.com/oauth/token");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toContain("application/x-www-form-urlencoded");
    const body = new URLSearchParams(init.body.toString());
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
  });

  it("Client Secret은 켜져 있을 때만 싣는다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "닉" } } });
    await fetchKakaoProfileByCode("auth-code");
    expect(new URLSearchParams(fetchMock.mock.calls[0][1].body.toString()).has("client_secret")).toBe(
      false
    );

    fetchMock.mockReset();
    process.env.KAKAO_CLIENT_SECRET = "secret";
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "닉" } } });
    await fetchKakaoProfileByCode("auth-code");
    expect(new URLSearchParams(fetchMock.mock.calls[0][1].body.toString()).get("client_secret")).toBe(
      "secret"
    );
  });

  it("프로필 조회는 발급받은 토큰을 Bearer로 보낸다 — 토큰은 저장하지 않는다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "닉" } } });

    await fetchKakaoProfileByCode("auth-code");

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("https://kapi.kakao.com/v2/user/me");
    expect(init.headers.Authorization).toBe("Bearer access-token");
  });

  it("회원번호는 문자열로 맞춘다 — 숫자로 두면 DB의 providerId와 타입이 어긋난다", async () => {
    mockKakaoFlow({ id: 4103829173, kakao_account: { profile: { nickname: "닉" } } });

    expect((await fetchKakaoProfileByCode("auth-code")).id).toBe("4103829173");
  });

  it("닉네임 동의를 안 받았으면 기본 이름을 쓴다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: {} });

    expect((await fetchKakaoProfileByCode("auth-code")).nickname).toBe("대저니유 이용자");
  });

  it("닉네임이 공백뿐이어도 기본 이름으로 채운다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "   " } } });

    expect((await fetchKakaoProfileByCode("auth-code")).nickname).toBe("대저니유 이용자");
  });

  it("이메일 동의를 안 받았으면 null — 계정 식별은 회원번호로 한다", async () => {
    mockKakaoFlow({ id: 1, kakao_account: { profile: { nickname: "닉" } } });

    expect((await fetchKakaoProfileByCode("auth-code")).email).toBeNull();
  });

  it("토큰 교환이 실패하면 API 오류로 구분한다", async () => {
    fetchMock.mockResolvedValueOnce(new Response("invalid_grant", { status: 401 }));

    await expect(fetchKakaoProfileByCode("bad-code")).rejects.toThrow(KakaoApiError);
  });

  it("200인데 access_token이 없어도 API 오류로 본다", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "invalid_request" }));

    await expect(fetchKakaoProfileByCode("auth-code")).rejects.toThrow(/access_token이 없습니다/);
  });

  it("프로필 조회가 실패하면 API 오류로 구분한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "access-token" }))
      .mockResolvedValueOnce(new Response("unauthorized", { status: 401 }));

    await expect(fetchKakaoProfileByCode("auth-code")).rejects.toThrow(KakaoApiError);
  });

  it("설정이 없으면 네트워크를 타기 전에 설정 오류로 멈춘다", async () => {
    delete process.env.KAKAO_REDIRECT_URI;

    await expect(fetchKakaoProfileByCode("auth-code")).rejects.toThrow(KakaoConfigError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
