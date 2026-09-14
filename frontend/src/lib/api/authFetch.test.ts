import { afterEach, describe, expect, it, vi } from "vitest";
import { apiUrl, authFetch } from "@/lib/api/authFetch";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("apiUrl", () => {
  it("오리진이 없으면 상대경로 그대로 둔다 — 로컬은 next rewrites가 받는다", () => {
    expect(apiUrl("/api/auth/me")).toBe("/api/auth/me");
  });

  it("이미 절대 URL이면 건드리지 않는다", () => {
    expect(apiUrl("https://daejourneyu-production.up.railway.app/api/posts")).toBe(
      "https://daejourneyu-production.up.railway.app/api/posts"
    );
  });

  it("오리진이 설정돼 있으면 앞에 붙여 백엔드를 직접 부른다", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "https://api.example.com");
    vi.resetModules();
    // 오리진은 모듈 로드 시점에 한 번 읽으므로 다시 import해야 반영된다.
    const { apiUrl: freshApiUrl } = await import("@/lib/api/authFetch");

    expect(freshApiUrl("/api/posts")).toBe("https://api.example.com/api/posts");
  });
});

describe("authFetch", () => {
  it("인증 쿠키가 실리도록 credentials를 붙이고 나머지 init은 그대로 넘긴다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    await authFetch("/api/pets", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenCalledWith("/api/pets", {
      method: "POST",
      body: "{}",
      credentials: "include",
    });
  });
});
