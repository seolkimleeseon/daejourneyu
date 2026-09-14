import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasSeenOnboarding } from "@/lib/onboarding";
import OnboardingPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("온보딩 첫 화면", () => {
  it("가입 · 로그인 · 둘러보기 세 갈래를 준다", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("button", { name: "시작하기" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "이미 계정이 있어요" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "로그인 없이 둘러볼래요" })).toBeTruthy();
  });

  it("시작하기는 가입, 아래 버튼은 로그인으로 보낸다", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "시작하기" }));
    expect(nav.push).toHaveBeenCalledWith("/onboarding/signup");

    await user.click(screen.getByRole("button", { name: "이미 계정이 있어요" }));
    expect(nav.push).toHaveBeenCalledWith("/onboarding/login");
  });

  it("둘러보기로 나가면 '봤음'을 기록해 다음 진입부터 홈으로 간다", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    expect(hasSeenOnboarding()).toBe(false);

    await user.click(screen.getByRole("button", { name: "로그인 없이 둘러볼래요" }));

    expect(hasSeenOnboarding()).toBe(true);
    // replace라야 뒤로가기로 온보딩에 다시 갇히지 않는다.
    expect(nav.replace).toHaveBeenCalledWith("/home");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("가입·로그인으로 빠질 때는 아직 '봤음'으로 치지 않는다", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: "시작하기" }));

    expect(hasSeenOnboarding()).toBe(false);
  });
});
