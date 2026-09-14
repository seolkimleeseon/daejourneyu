import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedPager } from "@/components/feed/FeedPager";

describe("FeedPager", () => {
  it("페이지가 하나뿐이면 그리지 않는다", () => {
    const { container } = render(<FeedPager page={0} totalPages={1} onChange={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });

  it("전체 페이지 번호를 두고 현재 페이지를 표시한다", () => {
    render(<FeedPager page={1} totalPages={3} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "2페이지" }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(screen.getByRole("button", { name: "1페이지" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^\d+페이지$/ })).toHaveLength(3);
  });

  it("번호와 화살표로 페이지를 옮긴다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FeedPager page={1} totalPages={3} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "3페이지" }));
    expect(onChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "이전 페이지" }));
    expect(onChange).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole("button", { name: "다음 페이지" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("양 끝에서는 넘어갈 방향의 화살표를 잠근다", () => {
    const { unmount } = render(<FeedPager page={0} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "이전 페이지" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "다음 페이지" }).hasAttribute("disabled")).toBe(
      false
    );
    unmount();

    render(<FeedPager page={2} totalPages={3} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "다음 페이지" }).hasAttribute("disabled")).toBe(true);
  });
});
