import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginRequiredGate } from "@/components/course/LoginRequiredGate";

// 안쪽 LoginModal이 현재 경로를 next로 넘기려 usePathname까지 쓴다.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/schedule/vault",
}));

/** 모달은 닫혀 있어도 DOM에 남는다 — 오버레이 불투명도로 열림을 확인한다. */
function modalOpen(): boolean {
  return !!document.querySelector(".fixed.opacity-100");
}

/** 모달도 "로그인이 필요해요"·"로그인"을 갖고 있어 가드 본문만 따로 봐야 한다. */
function inGate(text: string): HTMLElement[] {
  return screen.queryAllByText(text).filter((element) => !element.closest(".fixed"));
}

function gateButton(name: string): HTMLElement {
  return screen
    .getAllByRole("button", { name })
    .find((button) => !button.closest(".fixed"))!;
}

describe("LoginRequiredGate", () => {
  it("기본 문구로 로그인이 필요하다고 알린다", () => {
    render(<LoginRequiredGate />);

    expect(inGate("로그인이 필요해요")).toHaveLength(1);
    expect(screen.getByText(/코스를 저장하고 관리하려면/)).toBeTruthy();
  });

  it("문구를 바꿔 쓸 수 있다", () => {
    render(<LoginRequiredGate message="보관함을 보려면 로그인해주세요" />);

    expect(screen.getByText("보관함을 보려면 로그인해주세요")).toBeTruthy();
  });

  it("버튼을 누르면 로그인 모달을 연다", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredGate />);

    expect(modalOpen()).toBe(false);
    await user.click(gateButton("로그인하기"));

    expect(modalOpen()).toBe(true);
  });

  it("compact는 화면을 독차지하지 않는 배너로 둔다", () => {
    render(<LoginRequiredGate compact />);

    // 큰 제목 없이 한 줄 안내 + 짧은 버튼만.
    expect(inGate("로그인이 필요해요")).toHaveLength(0);
    expect(gateButton("로그인")).toBeTruthy();
  });

  it("compact에서도 모달은 똑같이 열린다", async () => {
    const user = userEvent.setup();
    render(<LoginRequiredGate compact />);

    await user.click(gateButton("로그인"));

    expect(modalOpen()).toBe(true);
  });
});
