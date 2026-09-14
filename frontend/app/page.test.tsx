import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const onboarding = vi.hoisted(() => ({ hasSeenOnboarding: vi.fn() }));
vi.mock("@/lib/onboarding", () => ({ hasSeenOnboarding: onboarding.hasSeenOnboarding }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("첫 진입 분기", () => {
  it("온보딩을 이미 본 사람은 홈으로 보낸다", () => {
    onboarding.hasSeenOnboarding.mockReturnValue(true);

    render(<RootPage />);

    expect(nav.replace).toHaveBeenCalledWith("/home");
  });

  it("처음 온 사람은 온보딩으로 보낸다", () => {
    onboarding.hasSeenOnboarding.mockReturnValue(false);

    render(<RootPage />);

    expect(nav.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("히스토리를 쌓지 않는다 — 뒤로가기로 이 빈 화면에 돌아오면 안 된다", () => {
    onboarding.hasSeenOnboarding.mockReturnValue(true);

    render(<RootPage />);

    expect(nav.push).not.toHaveBeenCalled();
  });

  it("판단이 끝날 때까지 아무것도 그리지 않는다 — 스플래시가 덮는다", () => {
    onboarding.hasSeenOnboarding.mockReturnValue(true);

    const { container } = render(<RootPage />);

    expect(container.innerHTML).toBe("");
  });
});
