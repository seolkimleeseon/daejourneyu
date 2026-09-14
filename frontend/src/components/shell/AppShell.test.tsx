import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/shell/AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));

describe("AppShell", () => {
  it("탭 화면과 하단 네비를 함께 올린다", () => {
    render(
      <AppShell>
        <div>홈 화면</div>
      </AppShell>
    );

    expect(screen.getByText("홈 화면")).toBeTruthy();
    expect(screen.getByRole("navigation")).toBeTruthy();
  });

  it("콘텐츠 아래에 네비 높이만큼 여백을 둔다 — 마지막 항목이 가리지 않게", () => {
    render(
      <AppShell>
        <div>홈 화면</div>
      </AppShell>
    );

    const content = screen.getByText("홈 화면").parentElement as HTMLElement;
    expect(content.className).toContain("pb-[76px]");
  });

  it("TopBar는 올리지 않는다 — 페이지마다 직접 렌더링하는 구조다", () => {
    render(
      <AppShell>
        <div>홈 화면</div>
      </AppShell>
    );

    expect(screen.queryByRole("button", { name: /뒤로/ })).toBeNull();
  });
});
