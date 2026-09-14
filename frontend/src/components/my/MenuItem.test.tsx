import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuItem } from "@/components/my/MenuItem";

describe("MenuItem", () => {
  it("라벨과 오른쪽 보조 문구를 보여주고, 누르면 알린다", async () => {
    const onClick = vi.fn();
    render(<MenuItem label="내가 쓴 후기" trailing="3개 ›" onClick={onClick} />);

    expect(screen.getByText("내가 쓴 후기")).toBeTruthy();
    expect(screen.getByText("3개 ›")).toBeTruthy();

    await userEvent.setup().click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("톤에 따라 라벨 색을 바꾼다", () => {
    render(<MenuItem label="로그아웃" tone="danger" onClick={vi.fn()} />);

    expect(screen.getByText("로그아웃").className).toContain("text-accent-coral");
  });
});
