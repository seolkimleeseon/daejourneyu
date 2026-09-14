import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.JWT_SECRET = "test-secret";
process.env.FRONTEND_ORIGIN = "http://localhost:3000";

const { prisma } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
}));
vi.mock("../lib/prisma", () => ({ prisma }));

const kakao = vi.hoisted(() => ({
  buildAuthorizeUrl: vi.fn(),
  fetchKakaoProfileByCode: vi.fn(),
}));
vi.mock("../lib/kakao", async () => {
  const actual = await vi.importActual<typeof import("../lib/kakao")>("../lib/kakao");
  return { ...actual, ...kakao };
});

import authKakaoRouter from "./authKakao";
import { KakaoApiError, KakaoConfigError } from "../lib/kakao";
import { AUTH_COOKIE, createTestApp } from "../test/testApp";

const app = createTestApp("/api/auth/kakao", authKakaoRouter);
const STATE_COOKIE = "daejourneyu_kakao_state";

const profile = { id: "9876", nickname: "콩이네", email: "kong@example.com" };

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "kong@example.com",
    nickname: "콩이네",
    provider: "kakao",
    providerId: "9876",
    passwordHash: null,
    ...overrides,
  };
}

/** Express가 쿠키 값을 URL 인코딩해 내보내므로(`%3A%2Fhome`) 되돌려 읽는다. */
function readSetCookie(response: { headers: Record<string, string[]> }): string {
  return decodeURIComponent(response.headers["set-cookie"][0]);
}

/** 콜백에 넘길 state 쿠키 — start가 심는 `<state>:<next>` 형식. */
function stateCookie(state: string, next = "/home") {
  return `${STATE_COOKIE}=${state}:${next}`;
}

beforeEach(() => {
  vi.clearAllMocks();
  kakao.buildAuthorizeUrl.mockReturnValue("https://kauth.kakao.com/oauth/authorize?client_id=x");
});

describe("GET /start", () => {
  it("state 쿠키를 심고 카카오 동의 화면으로 보낸다", async () => {
    const response = await request(app).get("/api/auth/kakao/start");

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("kauth.kakao.com");
    const [cookie] = response.headers["set-cookie"];
    expect(cookie).toContain(STATE_COOKIE);
    expect(cookie).toContain("HttpOnly");
  });

  it("쿠키에 심는 state를 인가 URL에 그대로 넘긴다", async () => {
    const response = await request(app).get("/api/auth/kakao/start");

    const [, state] = /daejourneyu_kakao_state=([0-9a-f]+):/.exec(readSetCookie(response))!;
    expect(kakao.buildAuthorizeUrl).toHaveBeenCalledWith(state);
  });

  it("돌아갈 곳(next)을 state 쿠키에 함께 담는다", async () => {
    const response = await request(app).get("/api/auth/kakao/start?next=/my");

    expect(readSetCookie(response)).toContain(":/my");
  });

  it("외부 주소는 next로 받지 않는다 — 열린 리다이렉트 방지", async () => {
    const evil = await request(app).get("/api/auth/kakao/start?next=//evil.com");
    const absolute = await request(app).get("/api/auth/kakao/start?next=https://evil.com");

    expect(readSetCookie(evil)).toContain(":/home");
    expect(readSetCookie(absolute)).toContain(":/home");
  });

  it("카카오 키가 비어 있으면 JSON 500 대신 로그인 화면으로 되돌린다", async () => {
    kakao.buildAuthorizeUrl.mockImplementation(() => {
      throw new KakaoConfigError("KAKAO_REST_API_KEY 없음");
    });

    const response = await request(app).get("/api/auth/kakao/start");

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      "http://localhost:3000/onboarding/login?error=kakao_config"
    );
  });
});

describe("GET /callback", () => {
  it("state가 다르면 우리가 시작한 로그인이 아니므로 막는다", async () => {
    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=다른값")
      .set("Cookie", stateCookie("original"));

    expect(response.headers.location).toContain("error=kakao_state");
    expect(kakao.fetchKakaoProfileByCode).not.toHaveBeenCalled();
  });

  it("state 쿠키 자체가 없어도 막는다", async () => {
    const response = await request(app).get("/api/auth/kakao/callback?code=abc&state=s1");

    expect(response.headers.location).toContain("error=kakao_state");
  });

  it("사용자가 동의를 거부해 code가 없으면 kakao_denied", async () => {
    const response = await request(app)
      .get("/api/auth/kakao/callback?state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(response.headers.location).toContain("error=kakao_denied");
  });

  it("카카오 API 실패와 설정 오류를 다른 코드로 구분한다", async () => {
    kakao.fetchKakaoProfileByCode.mockRejectedValueOnce(new KakaoApiError("토큰 교환 실패"));
    const apiFail = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    kakao.fetchKakaoProfileByCode.mockRejectedValueOnce(new KakaoConfigError("키 없음"));
    const configFail = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(apiFail.headers.location).toContain("error=kakao_api");
    expect(configFail.headers.location).toContain("error=kakao_config");
  });

  it("DB가 꺼져 있으면 kakao_db로 돌려보낸다 — 카카오 문제와 구분되는 신호다", async () => {
    kakao.fetchKakaoProfileByCode.mockResolvedValue(profile);
    prisma.user.findUnique.mockRejectedValue(new Error("Can't reach database server"));

    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(response.headers.location).toContain("error=kakao_db");
  });

  it("첫 로그인이면 계정을 만들고 반려동물 등록으로 보낸다", async () => {
    kakao.fetchKakaoProfileByCode.mockResolvedValue(profile);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userRow());

    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ provider: "kakao", providerId: "9876" }),
    });
    expect(response.headers.location).toBe("http://localhost:3000/onboarding/pet-register");
    expect(response.headers["set-cookie"].join()).toContain(AUTH_COOKIE);
  });

  it("이미 가입한 사용자는 닉네임만 갱신하고 홈으로 보낸다", async () => {
    kakao.fetchKakaoProfileByCode.mockResolvedValue(profile);
    prisma.user.findUnique.mockResolvedValue(userRow({ nickname: "옛날닉" }));
    prisma.user.update.mockResolvedValue(userRow());

    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { nickname: "콩이네" },
    });
    expect(response.headers.location).toBe("http://localhost:3000/home");
  });

  it("신규 가입이라도 보려던 화면이 있으면 그쪽이 우선이다", async () => {
    kakao.fetchKakaoProfileByCode.mockResolvedValue(profile);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userRow());

    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1", "/schedule"));

    expect(response.headers.location).toBe("http://localhost:3000/schedule");
  });

  it("한 번 쓴 state 쿠키는 비운다 — 재사용을 막는다", async () => {
    kakao.fetchKakaoProfileByCode.mockResolvedValue(profile);
    prisma.user.findUnique.mockResolvedValue(userRow());
    prisma.user.update.mockResolvedValue(userRow());

    const response = await request(app)
      .get("/api/auth/kakao/callback?code=abc&state=s1")
      .set("Cookie", stateCookie("s1"));

    expect(response.headers["set-cookie"].join()).toContain(`${STATE_COOKIE}=;`);
  });
});
