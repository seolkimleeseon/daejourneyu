import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeedSegments } from "@/components/feed/FeedSegments";

describe("FeedSegments", () => {
  it("코스·아티클·내 글 세 탭을 그리고 현재 탭을 강조한다", () => {
    render(<FeedSegments value="article" onChange={vi.fn()} />);

    const labels = screen.getAllByRole("button").map((button) => button.textContent);
    expect(labels).toEqual(["코스", "아티클", "내 글"]);
    expect(screen.getByRole("button", { name: "아티클" }).className).toContain("bg-brand-500");
    expect(screen.getByRole("button", { name: "코스" }).className).not.toContain("bg-brand-500");
  });

  it("탭을 누르면 해당 키로 알린다", async () => {
    const onChange = vi.fn();
    render(<FeedSegments value="course" onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "내 글" }));

    expect(onChange).toHaveBeenCalledWith("mine");
  });
});
