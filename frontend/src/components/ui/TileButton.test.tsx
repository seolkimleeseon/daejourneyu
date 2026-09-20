import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TileButton } from "@/components/ui/TileButton";

const base = {
  tone: "brand",
  emoji: "🐾",
  title: "AI 코스 추천",
  subtitle: "우리 아이 성향에 맞게",
  onClick: vi.fn(),
} as const;

describe("TileButton", () => {
  it("제목과 부제를 함께 보여준다", () => {
    render(<TileButton variant="outlined" {...base} />);

    expect(screen.getByRole("button", { name: /AI 코스 추천/ })).toBeTruthy();
    expect(screen.getByText("우리 아이 성향에 맞게")).toBeTruthy();
  });

  it.each(["outlined", "filled"] as const)("%s에서 클릭을 전달한다", async (variant) => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<TileButton variant={variant} {...base} onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("outlined는 카드에 테두리를 두고 아이콘만 톤 색을 쓴다", () => {
    const { container } = render(<TileButton variant="outlined" {...base} tone="purple" />);

    expect(container.innerHTML).toContain("border-line");
    expect(container.innerHTML).toContain("bg-icon-mbti");
  });

  it("filled는 카드 전체를 톤 색으로 칠한다", () => {
    const { container } = render(<TileButton variant="filled" {...base} tone="amber" />);

    expect(container.innerHTML).toContain("bg-accent-amber-light");
    expect(container.innerHTML).not.toContain("border-line");
  });

  it("기본은 평면 이모지 칩 — 공용 primitive라 3D는 원하는 화면에서만 켠다", () => {
    const { container } = render(<TileButton variant="outlined" {...base} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("🐾")).toBeTruthy();
  });

  it("icon3D를 켜면 3D 아이콘으로 바꾼다", () => {
    const { container } = render(<TileButton variant="outlined" {...base} icon3D />);

    expect(container.querySelector("img")?.getAttribute("src")).toContain("paw_prints_3d");
  });

  it("outlined의 3D 아이콘에는 톤에 맞는 글로우를 깔아 배경에서 띄운다", () => {
    const { container } = render(<TileButton variant="outlined" {...base} tone="coral" icon3D />);

    expect(container.querySelector("[aria-hidden]")?.className).toContain("bg-accent-coral");
  });
});
