import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginModal } from "@/components/my/LoginModal";

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: "/my" as string | null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}));

function overlay(): HTMLElement {
  return screen.getByText("로그인이 필요해요").closest(".fixed") as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.pathname = "/my";
});

describe("LoginModal", () => {
  it("닫혀 있으면 보이지 않는 상태로 둔다", () => {
    render(<LoginModal open={false} onClose={vi.fn()} />);

    expect(overlay().className).toContain("opacity-0");
  });

  it("로그인·회원가입은 모달을 닫고 지금 경로를 next로 넘겨 이동한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LoginModal open onClose={onClose} />);
    expect(overlay().className).toContain("opacity-100");

    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenLastCalledWith("/onboarding/login?next=%2Fmy");

    await user.click(screen.getByRole("button", { name: "회원가입" }));
    expect(nav.push).toHaveBeenLastCalledWith("/onboarding/signup?next=%2Fmy");
  });

  it("경로를 모르면 홈으로 돌아오게 한다", async () => {
    nav.pathname = null;
    render(<LoginModal open onClose={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "로그인" }));

    expect(nav.push).toHaveBeenCalledWith("/onboarding/login?next=%2Fhome");
  });

  it("닫기와 바깥 영역은 이동 없이 닫기만 한다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<LoginModal open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "닫기" }));
    await user.click(overlay());

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(nav.push).not.toHaveBeenCalled();
  });
});
