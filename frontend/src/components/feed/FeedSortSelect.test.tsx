import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedSortSelect } from "@/components/feed/FeedSortSelect";

const OPTIONS = [
  { value: "saves" as const, label: "담긴순" },
  { value: "recent" as const, label: "최신순" },
];

function renderSelect(onChange = vi.fn()) {
  render(<FeedSortSelect value="saves" options={OPTIONS} onChange={onChange} />);
  return { onChange, trigger: screen.getByRole("button", { name: "정렬 기준" }) };
}

describe("FeedSortSelect", () => {
  it("닫힌 상태로 현재 선택지를 보여준다", () => {
    const { trigger } = renderSelect();

    expect(trigger.textContent).toContain("담긴순");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("열면 선택지 목록에 현재 값을 선택됨으로 표시하고, 고르면 알리고 닫는다", async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = renderSelect();

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("option", { name: "담긴순" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("option", { name: "최신순" }).getAttribute("aria-selected")).toBe("false");

    await user.click(screen.getByRole("option", { name: "최신순" }));

    expect(onChange).toHaveBeenCalledWith("recent");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("Esc로 닫힌다", async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = renderSelect();

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("바깥을 누르면 닫힌다", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelect();

    await user.click(trigger);
    await user.click(document.body);

    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
