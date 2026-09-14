import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "@/components/shell/TopBar";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TopBar", () => {
  it("제목을 보여준다", () => {
    render(<TopBar title="마이" />);

    expect(screen.getByText("마이")).toBeTruthy();
  });

  it("showBack이 없으면 뒤로 버튼을 감춘다 — 자리는 남겨 제목이 가운데 오게 한다", () => {
    render(<TopBar title="홈" />);

    const back = screen.getByRole("button", { name: /뒤로/ });
    expect(back.className).toContain("invisible");
    expect(back.className).toContain("min-w-9");
  });

  it("showBack이면 뒤로 버튼이 보이고 눌러서 돌아간다", async () => {
    const user = userEvent.setup();
    render(<TopBar title="내가 쓴 후기" showBack />);

    const back = screen.getByRole("button", { name: /뒤로/ });
    expect(back.className).not.toContain("invisible");

    await user.click(back);
    expect(nav.back).toHaveBeenCalledTimes(1);
  });

  it("onBack을 주면 라우터 대신 그쪽을 쓴다 — 위저드는 내부 스텝을 되돌려야 한다", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<TopBar title="코스 만들기" showBack onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: /뒤로/ }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(nav.back).not.toHaveBeenCalled();
  });

  it("오른쪽 슬롯에 넘긴 요소를 그린다", () => {
    render(<TopBar title="코스" rightSlot={<button type="button">저장</button>} />);

    expect(screen.getByRole("button", { name: "저장" })).toBeTruthy();
  });

  it("전역 고정이 아니라 콘텐츠 위에 붙는다(sticky) — 페이지마다 직접 렌더링하는 구조다", () => {
    const { container } = render(<TopBar title="마이" />);

    expect((container.firstElementChild as HTMLElement).className).toContain("sticky");
  });
});
