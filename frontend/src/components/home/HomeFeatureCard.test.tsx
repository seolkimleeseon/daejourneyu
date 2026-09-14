import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomeFeatureCard } from "@/components/home/HomeFeatureCard";

const base = {
  emoji: "🎪",
  eyebrow: "FESTIVAL",
  titleLines: ["대전의 축제를", "한눈에"] as [string, string],
  ctaLabel: "축제 캘린더 보기",
  gradientClass: "bg-gradient-to-br from-accent-purple to-brand",
  onClick: vi.fn(),
};

describe("HomeFeatureCard", () => {
  it("제목 두 줄과 눈썹 문구·행동 문구를 보여준다", () => {
    render(<HomeFeatureCard {...base} />);

    const card = screen.getByRole("button");
    expect(card.textContent).toContain("대전의 축제를");
    expect(card.textContent).toContain("한눈에");
    expect(screen.getByText("FESTIVAL")).toBeTruthy();
    expect(screen.getByText(/축제 캘린더 보기/)).toBeTruthy();
  });

  it("부제는 있을 때만 보여준다", () => {
    const { unmount } = render(<HomeFeatureCard {...base} />);
    expect(screen.queryByText("9월에 열리는 축제 3개")).toBeNull();
    unmount();

    render(<HomeFeatureCard {...base} subtitle="9월에 열리는 축제 3개" />);
    expect(screen.getByText("9월에 열리는 축제 3개")).toBeTruthy();
  });

  it("넘겨받은 배경 스킨을 그대로 쓴다", () => {
    render(<HomeFeatureCard {...base} />);

    expect(screen.getByRole("button").className).toContain("from-accent-purple");
  });

  it("누르면 콜백을 부른다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<HomeFeatureCard {...base} onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
