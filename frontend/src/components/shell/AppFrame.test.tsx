import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppFrame } from "@/components/shell/AppFrame";

/** 가운데 앱 프레임 — 본문을 직접 감싸는 요소다. */
function frame(): HTMLElement {
  return screen.getByText("본문").parentElement as HTMLElement;
}

describe("AppFrame", () => {
  it("자식을 가운데 프레임 안에 담는다", () => {
    render(
      <AppFrame>
        <div>본문</div>
      </AppFrame>
    );

    expect(screen.getByText("본문")).toBeTruthy();
  });

  it("프레임 폭은 모바일과 같게 고정한다 — 넓은 화면에서도 늘어나지 않는다", () => {
    render(
      <AppFrame>
        <div>본문</div>
      </AppFrame>
    );

    expect(frame().className).toContain("max-w-[480px]");
  });

  it("스크롤은 프레임만 한다 — 바깥이 같이 흐르면 사이드 장식이 딸려 올라간다", () => {
    const { container } = render(
      <AppFrame>
        <div>본문</div>
      </AppFrame>
    );

    expect((container.firstElementChild as HTMLElement).className).toContain("overflow-hidden");
    expect(frame().className).toContain("overflow-y-auto");
  });

  it("사이드 패널은 좁은 화면에서 감춘다", () => {
    const { container } = render(
      <AppFrame>
        <div>본문</div>
      </AppFrame>
    );

    const panels = Array.from(container.firstElementChild!.children).filter(
      (child) => child.className.includes("hidden")
    );
    expect(panels).toHaveLength(2);
    panels.forEach((panel) => expect(panel.className).toContain("lg:flex"));
  });

  it("넘긴 className을 프레임에 더한다", () => {
    render(
      <AppFrame className="bg-card">
        <div>본문</div>
      </AppFrame>
    );

    expect(frame().className).toContain("bg-card");
  });
});
