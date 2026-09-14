import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("자식을 그대로 담는다", () => {
    render(
      <Card>
        <span>한밭수목원</span>
      </Card>
    );

    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });

  it("누를 수 있을 때만 커서와 눌림 효과를 준다 — 장식용 카드는 눌리는 것처럼 보이면 안 된다", () => {
    const { container, unmount } = render(<Card>내용</Card>);
    expect(container.innerHTML).not.toContain("cursor-pointer");
    unmount();

    const { container: clickable } = render(<Card onClick={vi.fn()}>내용</Card>);
    expect(clickable.innerHTML).toContain("cursor-pointer");
  });

  it("클릭 핸들러를 전달한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>내용</Card>);

    await user.click(screen.getByText("내용"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("highlighted면 테두리와 배경을 강조한다", () => {
    const { container } = render(<Card highlighted>선택됨</Card>);

    expect(container.innerHTML).toContain("border-brand-400");
    expect(container.innerHTML).toContain("bg-brand-100");
  });

  it("나머지 속성은 컨테이너에 넘긴다", () => {
    render(
      <Card data-testid="place-card" role="group" aria-label="장소">
        내용
      </Card>
    );

    expect(screen.getByRole("group", { name: "장소" })).toBeTruthy();
  });
});
