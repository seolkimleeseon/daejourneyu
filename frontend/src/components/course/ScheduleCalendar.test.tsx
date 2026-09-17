import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduleCalendar } from "@/components/course/ScheduleCalendar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { makeCourse, makeSchedule, makeStop } from "@/test/fixtures";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const addSchedule = vi.fn();

const course = makeCourse({
  id: "course-1",
  label: "유성 산책 코스",
  nights: 1,
  source: "ai",
  days: [[makeStop({ placeId: "a" })], [makeStop({ placeId: "b" })]],
});

/**
 * 바텀시트는 닫혀 있어도 DOM에 남아 보관함 코스 목록을 함께 들고 있다 —
 * 본문(일정 목록)만 보려면 시트 안쪽(.fixed)을 걸러내야 한다.
 */
function inPage(text: string): HTMLElement[] {
  return screen.queryAllByText(text).filter((element) => !element.closest(".fixed"));
}

/** 날짜 칸만 고른다 — 월 이동 버튼과 구분한다. */
function dayCell(day: string): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent === day)!;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00"));
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useToastStore.setState({ message: null });
  useCourseStore.setState({ courses: [course], schedules: [], addSchedule });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("달 그리드", () => {
  it("초기 날짜가 없으면 오늘이 속한 달을 연다", () => {
    render(<ScheduleCalendar />);

    expect(screen.getByText("2026년 9월")).toBeTruthy();
    expect(screen.getByText("2026-09-14 일정")).toBeTruthy();
  });

  it("초기 날짜를 주면 그 날을 고른 채로 연다", () => {
    render(<ScheduleCalendar initialDate="2026-10-03" />);

    expect(screen.getByText("2026년 10월")).toBeTruthy();
    expect(screen.getByText("2026-10-03 일정")).toBeTruthy();
  });

  it("이전·다음 달로 넘긴다", async () => {
    const user = userEvent.setup();
    render(<ScheduleCalendar />);

    await user.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.getByText("2026년 8월")).toBeTruthy();
  });

  it("일정이 있는 날에 점을 찍는다", () => {
    useCourseStore.setState({
      courses: [makeCourse({ id: "course-1", nights: 0 })],
      schedules: [makeSchedule({ id: "s1", courseId: "course-1", date: "2026-09-20" })],
    });
    render(<ScheduleCalendar />);

    expect(dayCell("20").querySelector(".rounded-full")).toBeTruthy();
    expect(dayCell("21").querySelector(".rounded-full")).toBeNull();
  });

  it("여러 박이면 기간 내내 선으로 이어 표시한다 — 2박3일이 하루짜리 점처럼 보이지 않게", () => {
    useCourseStore.setState({
      courses: [makeCourse({ id: "course-1", nights: 2 })],
      schedules: [makeSchedule({ id: "s1", courseId: "course-1", date: "2026-09-20" })],
    });
    render(<ScheduleCalendar />);

    // 시작일은 왼쪽만, 끝일은 오른쪽만 둥글고, 가운데 날은 양쪽 다 안 둥글어 하나로 이어진 선처럼 보인다.
    expect(dayCell("20").querySelector(".bg-brand.rounded-l-full")).toBeTruthy();
    expect(dayCell("21").querySelector(".bg-brand")).toBeTruthy();
    expect(dayCell("21").querySelector(".rounded-l-full, .rounded-r-full")).toBeNull();
    expect(dayCell("22").querySelector(".bg-brand.rounded-r-full")).toBeTruthy();
    expect(dayCell("23").querySelector(".bg-brand")).toBeNull();
  });

  it("날짜를 누르면 그 날 일정으로 바꾼다", async () => {
    const user = userEvent.setup();
    render(<ScheduleCalendar />);

    await user.click(dayCell("25"));

    expect(screen.getByText("2026-09-25 일정")).toBeTruthy();
  });
});

describe("선택한 날의 일정", () => {
  it("일정이 없으면 비어 있다고 알린다", () => {
    render(<ScheduleCalendar />);

    expect(screen.getByText("이 날엔 등록된 일정이 없어요.")).toBeTruthy();
  });

  it("그 날 일정만 골라 코스 정보와 함께 보여준다", () => {
    useCourseStore.setState({
      schedules: [
        makeSchedule({ id: "s1", courseId: "course-1", date: "2026-09-14" }),
        makeSchedule({ id: "s2", courseId: "course-1", date: "2026-09-20" }),
      ],
    });
    render(<ScheduleCalendar />);

    expect(inPage("유성 산책 코스")).toHaveLength(1);
    expect(inPage("1박 2일 · 2곳")).toHaveLength(1);
    expect(inPage("AI 추천")).toHaveLength(1);
  });

  it("근처 축제가 있으면 함께 알려준다", () => {
    useCourseStore.setState({
      schedules: [
        makeSchedule({
          id: "s1",
          courseId: "course-1",
          date: "2026-09-14",
          festivalTitles: ["대전 0시 축제"],
        }),
      ],
    });
    render(<ScheduleCalendar />);

    expect(screen.getByText(/대전 0시 축제/)).toBeTruthy();
  });

  it("코스가 지워진 일정은 건너뛴다 — 빈 카드를 남기지 않는다", () => {
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "사라진-코스", date: "2026-09-14" })],
    });
    render(<ScheduleCalendar />);

    expect(inPage("유성 산책 코스")).toHaveLength(0);
  });

  it("일정 카드를 누르면 코스 상세로 보낸다", async () => {
    const user = userEvent.setup();
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "course-1", date: "2026-09-14" })],
    });
    render(<ScheduleCalendar />);

    await user.click(inPage("유성 산책 코스")[0]);

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/course-1");
  });
});

describe("코스 추가", () => {
  it("비로그인이면 추가 버튼을 감춘다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    render(<ScheduleCalendar />);

    expect(screen.queryByRole("button", { name: "+ 코스 추가" })).toBeNull();
  });

  it("보관함이 비었으면 코스 만들기로 안내한다", async () => {
    const user = userEvent.setup();
    useCourseStore.setState({ courses: [] });
    render(<ScheduleCalendar />);

    await user.click(screen.getByRole("button", { name: "+ 코스 추가" }));
    await user.click(screen.getByRole("button", { name: "코스 만들러 가기" }));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/new/mbti");
  });

  it("고른 날짜로 일정을 등록하고 알린다", async () => {
    const user = userEvent.setup();
    addSchedule.mockResolvedValue(undefined);
    render(<ScheduleCalendar />);

    await user.click(screen.getByRole("button", { name: "+ 코스 추가" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(addSchedule).toHaveBeenCalledWith("course-1", "2026-09-14");
    expect(useToastStore.getState().message).toBe("2026-09-14에 일정을 추가했어요");
  });

  it("등록에 실패하면 시트를 닫지 않고 사유만 알린다", async () => {
    const user = userEvent.setup();
    addSchedule.mockRejectedValue(new Error("서버 오류"));
    render(<ScheduleCalendar />);

    await user.click(screen.getByRole("button", { name: "+ 코스 추가" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(useToastStore.getState().message).toContain("일정 등록에 실패했어요");
    expect(screen.getByRole("button", { name: "추가" })).toBeTruthy();
  });
});
