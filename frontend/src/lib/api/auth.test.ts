import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginRequest, logoutRequest, meRequest, signupRequest } from "@/lib/api/auth";
import { makeUser } from "@/test/fixtures";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
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

describe("signupRequest / loginRequest", () => {
  it("JSON 본문을 POST하고 쿠키가 실리게 credentials를 붙인다", async () => {
    const user = makeUser();
    fetchMock.mockResolvedValue(jsonResponse({ user }));

    const result = await signupRequest({
      email: "a@b.com",
      nickname: "콩이네",
      password: "pw1234",
    });

    expect(result).toEqual({ ok: true, user });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com", nickname: "콩이네", password: "pw1234" }),
    });
  });

  it("실패 응답의 메시지와 필드별 오류를 그대로 전달한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "이미 가입된 이메일이에요", errors: { email: "중복" } }, 409)
    );

    expect(await signupRequest({ email: "a@b.com", nickname: "n", password: "p" })).toEqual({
      ok: false,
      message: "이미 가입된 이메일이에요",
      errors: { email: "중복" },
    });
  });

  it("본문이 JSON이 아닌 실패 응답에서도 터지지 않는다", async () => {
    fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }));

    expect(await loginRequest({ email: "a@b.com", password: "p" })).toEqual({
      ok: false,
      message: undefined,
      errors: undefined,
    });
  });

  it("백엔드가 꺼져 fetch 자체가 실패하면 서버 문제로 안내한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await loginRequest({ email: "a@b.com", password: "p" });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.message).toContain("서버에 연결할 수 없어요");
  });
});

describe("meRequest", () => {
  it("본문 없이 GET으로 세션을 확인한다", async () => {
    const user = makeUser();
    fetchMock.mockResolvedValue(jsonResponse({ user }));

    expect(await meRequest()).toEqual({ ok: true, user });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: undefined,
      body: undefined,
    });
  });

  it("쿠키가 없거나 만료면 실패를 그대로 돌려준다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));

    expect(await meRequest()).toEqual({ ok: false, message: "unauthorized", errors: undefined });
  });
});

describe("logoutRequest", () => {
  it("로그아웃을 POST한다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await logoutRequest();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("서버에 못 닿아도 던지지 않는다 — 클라이언트 세션은 비워야 한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(logoutRequest()).resolves.toBeUndefined();
  });
});
