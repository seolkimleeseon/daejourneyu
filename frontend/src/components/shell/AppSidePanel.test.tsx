import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppBrandPanel, AppDecorPanel } from "@/components/shell/AppSidePanel";

describe("AppBrandPanel", () => {
  it("워드마크와 소개 문구를 보여준다", () => {
    render(<AppBrandPanel />);

    expect(screen.getByText("대저니유")).toBeTruthy();
    expect(screen.getByText("DaeJourneyU")).toBeTruthy();
    expect(screen.getByText("반려동물과 함께하는 대전 여행 플랫폼")).toBeTruthy();
  });

  it("모바일 폭에서는 숨기고 넓은 화면에서만 펼친다", () => {
    const { container } = render(<AppBrandPanel />);

    const className = (container.firstElementChild as HTMLElement).className;
    expect(className).toContain("hidden");
    expect(className).toContain("lg:flex");
  });

  it("장식용 반짝임은 스크린리더가 읽지 않는다", () => {
    const { container } = render(<AppBrandPanel />);

    const sparkles = container.querySelectorAll("[aria-hidden]");
    expect(sparkles.length).toBeGreaterThan(0);
    sparkles.forEach((sparkle) => expect(sparkle.textContent).toBe("✦"));
  });
});

describe("AppDecorPanel", () => {
  it("반대쪽 균형만 맞추는 패널이라 글자가 없다", () => {
    const { container } = render(<AppDecorPanel />);

    expect(container.textContent).toBe("✦".repeat(6));
  });

  it("여기도 좁은 화면에서는 숨긴다", () => {
    const { container } = render(<AppDecorPanel />);

    expect((container.firstElementChild as HTMLElement).className).toContain("hidden");
  });
});
