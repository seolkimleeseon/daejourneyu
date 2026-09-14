import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CourseButton } from "@/components/course/CourseButton";

describe("CourseButton", () => {
  it("기본은 연한 민트 배경 + 진한 글씨 — 공용 primary의 낮은 명암비를 피한다", () => {
    render(<CourseButton>코스 저장</CourseButton>);

    const className = screen.getByRole("button").className;
    expect(className).toContain("bg-brand-100");
    expect(className).toContain("text-brand-700");
  });

  it("primary를 명시해도 같은 스킨을 쓴다", () => {
    render(<CourseButton variant="primary">코스 저장</CourseButton>);

    expect(screen.getByRole("button").className).toContain("bg-brand-100");
  });

  it("다른 변형에는 덧칠하지 않는다 — 공용 Button 그대로다", () => {
    render(<CourseButton variant="text">취소</CourseButton>);

    const className = screen.getByRole("button").className;
    expect(className).not.toContain("bg-brand-100");
    expect(className).toContain("bg-transparent");
  });

  it("넘긴 className과 핸들러는 그대로 전달한다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CourseButton className="w-auto px-6" onClick={onClick}>
        저장
      </CourseButton>
    );

    const button = screen.getByRole("button", { name: "저장" });
    expect(button.className).toContain("w-auto");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled도 그대로 넘어간다", () => {
    render(<CourseButton disabled>저장 중…</CourseButton>);

    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
