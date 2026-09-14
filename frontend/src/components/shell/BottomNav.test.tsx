import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/shell/BottomNav";

const route = vi.hoisted(() => ({ pathname: "/home" as string | null }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const TABS = [
  ["댕댕지도", "/map"],
  ["내 여정", "/schedule"],
  ["홈", "/home"],
  ["둘러보기", "/feed"],
  ["마이", "/my"],
] as const;

function tab(label: string): HTMLElement {
  return screen.getByRole("link", { name: label });
}

beforeEach(() => {
  route.pathname = "/home";
});

describe("BottomNav", () => {
  it("다섯 개 탭을 순서대로 둔다", () => {
    render(<BottomNav />);

    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(labels).toEqual(TABS.map(([label]) => label));
  });

  it.each(TABS)("%s 탭은 %s로 간다", (label, href) => {
    render(<BottomNav />);

    expect(tab(label).getAttribute("href")).toBe(href);
  });

  it("현재 탭만 강조한다", () => {
    route.pathname = "/feed";
    render(<BottomNav />);

    expect(tab("둘러보기").className).toContain("text-brand");
    expect(tab("홈").className).toContain("text-ink-muted");
  });

  it("하위 화면에 들어가 있어도 그 탭을 강조한다", () => {
    route.pathname = "/my/badges";
    render(<BottomNav />);

    expect(tab("마이").className).toContain("text-brand");
  });

  it("이름이 겹쳐 보이는 다른 경로까지 켜지지는 않는다", () => {
    // "/mypage"는 "/my"로 시작하지만 마이 탭의 하위 화면이 아니다.
    route.pathname = "/mypage";
    render(<BottomNav />);

    expect(tab("마이").className).toContain("text-ink-muted");
  });

  it("경로를 아직 모를 때도 터지지 않는다", () => {
    route.pathname = null;
    render(<BottomNav />);

    expect(screen.getAllByRole("link")).toHaveLength(5);
  });
});
