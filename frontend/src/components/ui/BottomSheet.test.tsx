import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "@/components/ui/BottomSheet";

/** 시트도 닫혀 있어도 DOM에 남는다 — 오버레이(첫 번째)와 패널(두 번째)로 상태를 본다. */
function parts(container: HTMLElement) {
  const [overlayEl, panelEl] = Array.from(container.children) as HTMLElement[];
  return { overlay: overlayEl, panel: panelEl };
}

describe("BottomSheet", () => {
  it("닫혀 있으면 오버레이는 투명하고 패널은 화면 아래에 있다", () => {
    const { container } = render(<BottomSheet open={false} onClose={vi.fn()} />);
    const { overlay, panel } = parts(container);

    expect(overlay.className).toContain("opacity-0");
    expect(overlay.className).toContain("pointer-events-none");
    expect(panel.className).toContain("translate-y-full");
  });

  it("열리면 오버레이가 덮이고 패널이 올라온다", () => {
    const { container } = render(<BottomSheet open onClose={vi.fn()} />);
    const { overlay, panel } = parts(container);

    expect(overlay.className).toContain("opacity-100");
    expect(panel.className).toContain("translate-y-0");
  });

  it("제목과 자식을 그린다", () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="장소 고르기">
        <div>한밭수목원</div>
      </BottomSheet>
    );

    expect(screen.getByText("장소 고르기")).toBeTruthy();
    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });

  it("제목이 없으면 빈 줄을 남기지 않는다", () => {
    render(
      <BottomSheet open onClose={vi.fn()}>
        <div>본문</div>
      </BottomSheet>
    );

    expect(screen.getByText("본문")).toBeTruthy();
  });

  it("footer는 스크롤 영역 밖에 따로 둔다 — 목록이 길어도 버튼이 가려지지 않게", () => {
    render(
      <BottomSheet open onClose={vi.fn()} footer={<button type="button">완료</button>}>
        <div>본문</div>
      </BottomSheet>
    );

    const done = screen.getByRole("button", { name: "완료" });
    const scrollArea = screen.getByText("본문").closest(".overflow-y-auto");

    expect(done).toBeTruthy();
    expect(scrollArea?.contains(done)).toBe(false);
  });

  it("footer가 없으면 하단 영역 자체를 만들지 않는다", () => {
    const { container } = render(<BottomSheet open onClose={vi.fn()} />);

    expect(container.innerHTML).not.toContain("border-t border-line");
  });

  it("오버레이를 누르면 닫는다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<BottomSheet open onClose={onClose} />);

    await user.click(parts(container).overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("시트 안을 눌러도 닫히지 않는다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title="장소 고르기">
        <div>한밭수목원</div>
      </BottomSheet>
    );

    await user.click(screen.getByText("한밭수목원"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("닫혀 있으면 오버레이와 패널 모두 키보드 포커스를 받지 않는다", () => {
    const { container } = render(<BottomSheet open={false} onClose={vi.fn()} />);
    const { overlay, panel } = parts(container);

    expect(overlay.className).toContain("invisible");
    expect(panel.className).toContain("invisible");
  });

  it("열려 있으면 대화상자로 알려지고 ESC로 닫는다", async () => {
    const onClose = vi.fn();
    render(<BottomSheet open onClose={onClose} title="장소 고르기" />);

    expect(screen.getByRole("dialog", { name: "장소 고르기" })).toBeTruthy();
    await userEvent.setup().keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("닫혀 있을 때는 ESC에 반응하지 않는다", async () => {
    const onClose = vi.fn();
    render(<BottomSheet open={false} onClose={onClose} />);

    await userEvent.setup().keyboard("{Escape}");

    expect(onClose).not.toHaveBeenCalled();
  });
});
