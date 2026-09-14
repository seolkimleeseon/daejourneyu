import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShareCourseSummary } from "@/components/feed/ShareCourseSummary";
import { makeCourse, makeStop } from "@/test/fixtures";

describe("ShareCourseSummary", () => {
  it("코스 이름과 일정 길이·이동수단·전체 장소 수, 출처를 보여준다", () => {
    const course = makeCourse({
      label: "갑천 1박 코스",
      nights: 1,
      transport: "대중교통",
      source: "manual",
      days: [[makeStop({ placeId: "a" }), makeStop({ placeId: "b" })], [makeStop({ placeId: "c" })]],
    });

    render(<ShareCourseSummary course={course} />);

    expect(screen.getByText("갑천 1박 코스")).toBeTruthy();
    expect(screen.getByText("1박 2일 · 대중교통 · 장소 3곳")).toBeTruthy();
    expect(screen.getByText("직접 지음")).toBeTruthy();
  });

  it("고른 이모지가 없으면 출처별 기본 이모지를 쓴다", () => {
    const { rerender } = render(<ShareCourseSummary course={makeCourse({ emoji: null, source: "saved" })} />);
    expect(screen.getByText("🔖")).toBeTruthy();

    rerender(<ShareCourseSummary course={makeCourse({ emoji: "🌲", source: "saved" })} />);
    expect(screen.getByText("🌲")).toBeTruthy();
  });
});
