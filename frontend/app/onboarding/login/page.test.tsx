import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { hasSeenOnboarding } from "@/lib/onboarding";
import { makeUser } from "@/test/fixtures";
import LoginPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  useSearchParams: () => params.current,
}));

const login = vi.fn();
const user = makeUser({ nickname: "콩이맘" });

beforeEach(() => {
  vi.clearAllMocks();
  params.current = new URLSearchParams();
  window.localStorage.clear();
  useAuthStore.setState({ isLoggedIn: false, user: null, hydrated: true, login });
  useToastStore.setState({ message: null });
});

async function submit() {
  const actor = userEvent.setup();
  await actor.type(screen.getByLabelText("이메일"), " kong@example.com ");
  await actor.type(screen.getByLabelText("비밀번호"), "pw12345678");
  await actor.click(screen.getByRole("button", { name: "로그인" }));
}

describe("로그인", () => {
  it("이메일 앞뒤 공백을 잘라 보낸다", async () => {
    login.mockResolvedValue({ ok: true, user });
    render(<LoginPage />);

    await submit();

    expect(login).toHaveBeenCalledWith({ email: "kong@example.com", password: "pw12345678" });
  });

  it("성공하면 온보딩을 끝난 것으로 표시하고 홈으로 보낸다", async () => {
    login.mockResolvedValue({ ok: true, user });
    render(<LoginPage />);

    await submit();

    expect(hasSeenOnboarding()).toBe(true);
    expect(useToastStore.getState().message).toBe("콩이맘님, 반가워요!");
    expect(nav.replace).toHaveBeenCalledWith("/home");
  });

  it("게이팅에 걸려 왔으면 원래 보려던 화면으로 되돌린다", async () => {
    params.current = new URLSearchParams("next=/feed/post/abc");
    login.mockResolvedValue({ ok: true, user });
    render(<LoginPage />);

    await submit();

    expect(nav.replace).toHaveBeenCalledWith("/feed/post/abc");
  });

  it("서버가 필드 오류를 주면 해당 입력 아래에 붙인다", async () => {
    login.mockResolvedValue({ ok: false, errors: { email: "이메일 형식을 확인해주세요" } });
    render(<LoginPage />);

    await submit();

    expect(screen.getByText("이메일 형식을 확인해주세요")).toBeTruthy();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("필드 오류 없이 메시지만 오면 폼 아래에 문구로 띄운다", async () => {
    login.mockResolvedValue({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다" });
    render(<LoginPage />);

    await submit();

    expect(screen.getByText("이메일 또는 비밀번호가 올바르지 않습니다")).toBeTruthy();
  });

  it("실패해도 온보딩 완료로 표시하지 않는다", async () => {
    login.mockResolvedValue({ ok: false, message: "실패" });
    render(<LoginPage />);

    await submit();

    expect(hasSeenOnboarding()).toBe(false);
  });

  it("다시 시도하면 앞선 오류 표시를 지운다", async () => {
    const actor = userEvent.setup();
    login.mockResolvedValue({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다" });
    render(<LoginPage />);
    await submit();

    login.mockResolvedValue({ ok: true, user });
    await actor.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.queryByText("이메일 또는 비밀번호가 올바르지 않습니다")).toBeNull();
  });
});

describe("카카오 로그인 실패 안내", () => {
  it.each([
    ["kakao_db", "데이터베이스가 떠 있는지"],
    ["kakao_config", "backend/.env"],
    ["kakao_api", "카카오 서버와 통신하지 못했어요"],
    ["kakao_state", "로그인 요청이 만료됐어요"],
    ["kakao_denied", "카카오 로그인이 취소됐어요"],
    ["kakao_failed", "카카오 로그인에 실패했어요"],
  ])("%s는 원인을 구분해 안내한다", (code, expected) => {
    params.current = new URLSearchParams(`error=${code}`);
    render(<LoginPage />);

    expect(screen.getByText(new RegExp(expected))).toBeTruthy();
  });

  it("모르는 코드면 빈 배너를 띄우지 않는다", () => {
    params.current = new URLSearchParams("error=something_else");
    const { container } = render(<LoginPage />);

    expect(container.innerHTML).not.toContain("bg-accent-coral-light");
  });

  it("error가 없으면 배너 자체가 없다", () => {
    const { container } = render(<LoginPage />);

    expect(container.innerHTML).not.toContain("bg-accent-coral-light");
  });
});

describe("화면 이동", () => {
  it("가입 링크에 next를 이어 넘긴다", () => {
    params.current = new URLSearchParams("next=/my");
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "회원가입" }).getAttribute("href")).toBe(
      "/onboarding/signup?next=%2Fmy"
    );
  });

  it("카카오 버튼에도 next를 넘긴다", () => {
    params.current = new URLSearchParams("next=/my");
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: /카카오/ }).getAttribute("href")).toContain(
      "next=%2Fmy"
    );
  });
});
