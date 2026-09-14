import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { makeUser } from "@/test/fixtures";

const api = vi.hoisted(() => ({
  meRequest: vi.fn(),
  loginRequest: vi.fn(),
  signupRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));
vi.mock("@/lib/api/auth", () => api);

const user = makeUser();

beforeEach(() => {
  vi.clearAllMocks();
  // 모듈 상태라 테스트 사이에 이어진다.
  useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: false });
});

describe("hydrate", () => {
  it("세션이 살아 있으면 로그인 상태로 복구한다", async () => {
    api.meRequest.mockResolvedValue({ ok: true, user });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({ isLoggedIn: true, user, hydrated: true });
  });

  it("세션이 없어도 hydrated는 켠다 — 이게 안 켜지면 화면이 계속 로딩으로 남는다", async () => {
    api.meRequest.mockResolvedValue({ ok: false });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState()).toMatchObject({
      isLoggedIn: false,
      user: null,
      hydrated: true,
    });
  });
});

describe("login / signup", () => {
  it("성공하면 로그인 상태로 두고 결과를 그대로 돌려준다", async () => {
    api.loginRequest.mockResolvedValue({ ok: true, user });

    const result = await useAuthStore.getState().login({ email: "a@b.com", password: "pw" });

    expect(result).toEqual({ ok: true, user });
    expect(useAuthStore.getState()).toMatchObject({ isLoggedIn: true, user, hydrated: true });
  });

  it("실패하면 상태를 건드리지 않고 오류만 돌려준다", async () => {
    api.loginRequest.mockResolvedValue({ ok: false, message: "비밀번호가 달라요" });

    const result = await useAuthStore.getState().login({ email: "a@b.com", password: "x" });

    expect(result).toEqual({ ok: false, message: "비밀번호가 달라요" });
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });

  it("가입도 성공하면 바로 로그인 상태가 된다", async () => {
    api.signupRequest.mockResolvedValue({ ok: true, user });

    await useAuthStore.getState().signup({ email: "a@b.com", nickname: "콩이네", password: "pw" });

    expect(useAuthStore.getState()).toMatchObject({ isLoggedIn: true, user });
  });
});

describe("logout", () => {
  it("서버 로그아웃을 부른 뒤 세션을 비운다", async () => {
    useAuthStore.setState({ isLoggedIn: true, user, hydrated: true });
    api.logoutRequest.mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    expect(api.logoutRequest).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ isLoggedIn: false, user: null });
  });

  it("로그아웃 후에도 hydrated는 그대로 — 다시 로딩 화면으로 돌아가면 안 된다", async () => {
    useAuthStore.setState({ isLoggedIn: true, user, hydrated: true });
    api.logoutRequest.mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().hydrated).toBe(true);
  });
});
