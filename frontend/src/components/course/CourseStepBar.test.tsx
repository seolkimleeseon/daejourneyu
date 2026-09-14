import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseStepBar } from "@/components/course/CourseStepBar";

function step(label: string): HTMLElement {
  return screen.getByText(label).closest("div") as HTMLElement;
}

describe("CourseStepBar", () => {
  it("기본 4단계를 순서대로 보여준다", () => {
    render(<CourseStepBar active={0} />);

    ["기간", "조건", "이동", "코스"].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy()
    );
  });

  it("위저드마다 다른 스텝 구성을 받을 수 있다", () => {
    render(<CourseStepBar active={0} labels={["기간", "장소", "확인"]} />);

    expect(screen.getByText("장소")).toBeTruthy();
    expect(screen.queryByText("이동")).toBeNull();
  });

  it("지나온 단계는 체크로 바꾼다", () => {
    render(<CourseStepBar active={2} />);

    // 1·2단계는 완료 표시, 3단계는 번호 그대로.
    expect(screen.getAllByText("✓")).toHaveLength(2);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("현재 단계를 강조한다", () => {
    render(<CourseStepBar active={1} />);

    expect(step("조건").className).toContain("border-brand");
    expect(step("이동").className).toContain("text-ink-muted");
  });

  it("첫 단계에서는 완료 표시가 없다", () => {
    render(<CourseStepBar active={0} />);

    expect(screen.queryByText("✓")).toBeNull();
    expect(screen.getByText("1")).toBeTruthy();
  });
});
