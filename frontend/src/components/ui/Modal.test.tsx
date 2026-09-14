import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "@/components/ui/Modal";

/** Modal은 닫혀도 DOM에 남아 있다(투명도로만 숨김). 열림 여부는 오버레이 클래스로 본다. */
function overlay(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe("Modal", () => {
  it("닫혀 있으면 투명하고 클릭도 통과시킨다", () => {
    const { container } = render(<Modal open={false} onClose={vi.fn()} title="삭제할까요?" />);

    const className = overlay(container).className;
    expect(className).toContain("opacity-0");
    expect(className).toContain("pointer-events-none");
  });

  it("열리면 불투명해지고 클릭을 받는다", () => {
    const { container } = render(<Modal open onClose={vi.fn()} title="삭제할까요?" />);

    const className = overlay(container).className;
    expect(className).toContain("opacity-100");
    expect(className).not.toContain("pointer-events-none");
  });

  it("제목·설명·이모지·버튼을 그린다", () => {
    render(
      <Modal open onClose={vi.fn()} emoji="🥲" title="삭제할까요?" description="되돌릴 수 없어요">
        <button type="button">삭제</button>
      </Modal>
    );

    expect(screen.getByText("🥲")).toBeTruthy();
    expect(screen.getByText("삭제할까요?")).toBeTruthy();
    expect(screen.getByText("되돌릴 수 없어요")).toBeTruthy();
    expect(screen.getByRole("button", { name: "삭제" })).toBeTruthy();
  });

  it("이모지·설명은 없으면 빈 자리를 남기지 않는다", () => {
    render(<Modal open onClose={vi.fn()} title="제목만" />);

    expect(screen.queryByText("되돌릴 수 없어요")).toBeNull();
    expect(screen.getByText("제목만")).toBeTruthy();
  });

  it("바깥(오버레이)을 누르면 닫는다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<Modal open onClose={onClose} title="삭제할까요?" />);

    await user.click(overlay(container));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("내용 안을 눌러도 닫히지 않는다 — 버튼을 누르다 실수로 닫히면 안 된다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="삭제할까요?">
        <button type="button">삭제</button>
      </Modal>
    );

    await user.click(screen.getByText("삭제할까요?"));
    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("폭은 기본값을 쓰되 필요하면 넓힐 수 있다", () => {
    const { container, unmount } = render(<Modal open onClose={vi.fn()} title="기본" />);
    expect(container.innerHTML).toContain("w-[260px]");
    unmount();

    const { container: wide } = render(
      <Modal open onClose={vi.fn()} title="넓게" widthClass="w-[320px]" />
    );
    expect(wide.innerHTML).toContain("w-[320px]");
    expect(wide.innerHTML).not.toContain("w-[260px]");
  });
});
