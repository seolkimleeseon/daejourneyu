import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeBar } from "@/components/mbti/ThemeBar";

/**
 * 게이지 너비를 읽는다 — 매칭도가 실제 길이로 반영되는지 보는 게 이 컴포넌트의 핵심이다.
 * (아이콘도 인라인 width를 갖고 있어 채워지는 막대만 클래스로 집는다.)
 */
function gaugeWidth(container: HTMLElement): string {
  return (container.querySelector(".h-full.rounded-full") as HTMLElement).style.width;
}

describe("ThemeBar", () => {
  it("테마 이름과 매칭도를 함께 보여준다", () => {
    render(<ThemeBar theme="산책" percent={70} />);

    expect(screen.getByText("산책형")).toBeTruthy();
    expect(screen.getByText("70% 매칭")).toBeTruthy();
  });

  it("매칭도를 게이지 길이로 옮긴다", () => {
    const { container } = render(<ThemeBar theme="맛집" percent={35} />);

    expect(gaugeWidth(container)).toBe("35%");
  });

  it("0%도 그린다 — 줄이 통째로 빠지면 세 테마 비교가 안 된다", () => {
    const { container } = render(<ThemeBar theme="문화" percent={0} />);

    expect(screen.getByText("0% 매칭")).toBeTruthy();
    expect(gaugeWidth(container)).toBe("0%");
  });

  it.each([
    ["산책", "bg-brand"],
    ["맛집", "bg-accent-amber"],
    ["문화", "bg-accent-purple"],
  ] as const)("%s 테마는 제 색을 쓴다", (theme, expected) => {
    const { container } = render(<ThemeBar theme={theme} percent={50} />);

    expect(container.innerHTML).toContain(expected);
  });
});
