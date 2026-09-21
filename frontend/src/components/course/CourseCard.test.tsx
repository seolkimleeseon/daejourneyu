import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CourseCard } from "@/components/course/CourseCard";
import { makeCourse, makeStop } from "@/test/fixtures";

function setup(course = makeCourse(), scheduleCount?: number) {
  const onClick = vi.fn();
  const onAddSchedule = vi.fn();
  render(
    <CourseCard
      course={course}
      scheduleCount={scheduleCount}
      onClick={onClick}
      onAddSchedule={onAddSchedule}
    />
  );
  return { onClick, onAddSchedule, user: userEvent.setup() };
}

describe("CourseCard", () => {
  it("코스 이름과 요약을 보여준다", () => {
    setup(
      makeCourse({
        label: "유성 산책 코스",
        nights: 1,
        days: [[makeStop({ placeId: "a" }), makeStop({ placeId: "b" })], [makeStop({ placeId: "c" })]],
      })
    );

    expect(screen.getByText("유성 산책 코스")).toBeTruthy();
    expect(screen.getByText(/1박 2일 · 3곳/)).toBeTruthy();
  });

  it("모든 일차의 장소 수를 합쳐 센다", () => {
    setup(
      makeCourse({
        nights: 2,
        days: [[makeStop({ placeId: "a" })], [], [makeStop({ placeId: "b" })]],
      })
    );

    expect(screen.getByText(/2박 3일 · 2곳/)).toBeTruthy();
  });

  it("공유된 코스는 표시를 덧붙인다", () => {
    setup(makeCourse({ shared: true }));

    expect(screen.getByText(/· 공유됨/)).toBeTruthy();
  });

  it("공유 전에는 그 표시가 없다", () => {
    setup(makeCourse({ shared: false }));

    expect(screen.queryByText(/공유됨/)).toBeNull();
  });

  it.each([
    ["ai", "AI 추천"],
    ["manual", "직접 지음"],
    ["saved", "내가 담은 코스"],
  ] as const)("생성 출처 %s를 배지로 보여준다", (source, label) => {
    setup(makeCourse({ source }));

    expect(screen.getByText(label)).toBeTruthy();
  });

  it("일정이 없으면 등록을 권한다", () => {
    setup(makeCourse(), 0);

    expect(screen.getByRole("button", { name: /일정 추가하기/ })).toBeTruthy();
  });

  it("이미 등록된 일정이 있으면 개수를 보여주고 추가도 열어둔다", () => {
    // 같은 코스를 여러 날짜에 등록할 수 있어 개수로 다룬다.
    setup(makeCourse(), 2);

    expect(screen.getByRole("button", { name: /등록된 일정 2개 · 추가하기/ })).toBeTruthy();
  });

  it("카드를 누르면 상세로 보낸다", async () => {
    const { user, onClick } = setup();

    await user.click(screen.getByText("주말 산책 코스"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("일정 줄은 카드 클릭과 분리한다 — 상세로 새면 안 된다", async () => {
    const { user, onClick, onAddSchedule } = setup();

    await user.click(screen.getByRole("button", { name: /일정 추가하기/ }));

    expect(onAddSchedule).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("onDelete가 없으면 휴지통을 그리지 않는다", () => {
    setup();

    expect(screen.queryByRole("button", { name: "코스 삭제" })).toBeNull();
  });

  it("휴지통은 카드 클릭과 분리한다 — 상세로 새면 안 된다", async () => {
    const onDelete = vi.fn();
    const onClick = vi.fn();
    render(<CourseCard course={makeCourse()} onClick={onClick} onAddSchedule={vi.fn()} onDelete={onDelete} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "코스 삭제" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
