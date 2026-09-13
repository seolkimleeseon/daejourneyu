import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SameTypeFilter } from "@/components/feed/SameTypeFilter";

describe("SameTypeFilter", () => {
  it("기준 유형이 없으면 안내 문구와 함께 누를 수 없다", async () => {
    const onToggle = vi.fn();
    render(<SameTypeFilter active={false} petTypeName={null} onToggle={onToggle} />);
    const button = screen.getByRole("button");

    expect(button.textContent).toContain("MBTI를 검사하면 같은 유형 코스만 모아볼 수 있어요");
    expect((button as HTMLButtonElement).disabled).toBe(true);

    await userEvent.setup().click(button);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("유형이 있으면 유형 이름을 보여주고 켜짐 상태를 알린다", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <SameTypeFilter active={false} petTypeName="정겹게 달려가는 페스티벌맨" onToggle={onToggle} />
    );
    const button = screen.getByRole("button");

    expect(button.textContent).toContain("우리 아이와 같은 유형 · 정겹게 달려가는 페스티벌맨 코스만 보기");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await userEvent.setup().click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(<SameTypeFilter active petTypeName="정겹게 달려가는 페스티벌맨" onToggle={onToggle} />);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
  });
});
