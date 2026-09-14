import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Splash } from "@/components/shell/Splash";

const SHOW_MS = 1200;
const FADE_MS = 550;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Splash", () => {
  it("처음에는 브랜드 화면을 덮어 보여준다", () => {
    const { container } = render(<Splash />);

    expect(container.textContent).toContain("대저니유");
    expect((container.firstElementChild as HTMLElement).className).toContain("opacity-100");
  });

  it("잠시 뒤 서서히 사라진다", () => {
    const { container } = render(<Splash />);

    act(() => vi.advanceTimersByTime(SHOW_MS));

    const className = (container.firstElementChild as HTMLElement).className;
    expect(className).toContain("opacity-0");
    // 사라지는 동안에도 화면을 덮고 있으므로 클릭은 통과시켜야 한다.
    expect(className).toContain("pointer-events-none");
  });

  it("페이드가 끝나면 DOM에서 걷어낸다 — 남아 있으면 화면을 계속 덮는다", () => {
    const { container } = render(<Splash />);

    act(() => vi.advanceTimersByTime(SHOW_MS));
    expect(container.innerHTML).not.toBe("");

    act(() => vi.advanceTimersByTime(FADE_MS));
    expect(container.innerHTML).toBe("");
  });

  it("언마운트되면 남은 타이머를 정리한다", () => {
    const { unmount } = render(<Splash />);

    unmount();

    expect(() => act(() => vi.advanceTimersByTime(SHOW_MS + FADE_MS))).not.toThrow();
  });
});
