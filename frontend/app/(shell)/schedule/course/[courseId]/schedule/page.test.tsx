import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useToastStore } from "@/stores/useToastStore";
import { makeCourse, makeSchedule } from "@/test/fixtures";
import CourseScheduleAddPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/schedule" }));

vi.mock("@/hooks/useSyncCoursesFromApi", () => ({ useSyncCoursesFromApi: vi.fn() }));

const addSchedule = vi.fn();
const removeSchedule = vi.fn();

const course = makeCourse({ id: "c1", label: "유성 산책 코스" });

function setup(courseId = "c1") {
  const view = render(<CourseScheduleAddPage params={{ courseId }} />);
  return { ...view, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) };
}

/** 달력의 날짜 칸 — 월 이동 버튼(‹ ›)과 구분한다. */
function dayCell(day: string): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent === day)!;
}

/** 등록된 일정 한 줄. */
function scheduleRow(date: string): HTMLElement {
  return screen.getByText(`📅 ${date}`).parentElement as HTMLElement;
}

const saveButton = () => screen.getByRole("button", { name: /일정 등록하기/ });

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00"));
  addSchedule.mockResolvedValue(undefined);
  removeSchedule.mockResolvedValue(undefined);
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useToastStore.setState({ message: null, key: 0 });
  useCourseStore.setState({ courses: [course], schedules: [], addSchedule, removeSchedule });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("들어갈 수 있는지", () => {
  it("비로그인이면 달력 대신 로그인 안내를 보여준다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("일정을 등록하려면 로그인해주세요")).toBeTruthy();
    expect(screen.queryByText(/일정 등록하기/)).toBeNull();
  });

  it("없는 코스로 들어오면 빈 달력을 띄우지 않고 그렇게 말한다", () => {
    setup("사라진-코스");

    expect(screen.getByText("코스를 찾을 수 없어요")).toBeTruthy();
  });

  it("어느 코스에 날짜를 붙이는지 먼저 보여준다", () => {
    setup();

    expect(screen.getByText("유성 산책 코스")).toBeTruthy();
  });
});

describe("이미 등록된 일정", () => {
  it("하나도 없으면 목록 자체를 두지 않는다", () => {
    setup();

    expect(screen.queryByText("등록된 일정")).toBeNull();
  });

  it("이 코스 것만 날짜순으로 모아 보여준다", () => {
    useCourseStore.setState({
      schedules: [
        makeSchedule({ id: "s2", courseId: "c1", date: "2026-10-03" }),
        makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20" }),
        makeSchedule({ id: "s3", courseId: "다른-코스", date: "2026-09-21" }),
      ],
    });
    const { container } = setup();

    const dates = Array.from(container.querySelectorAll(".flex-col.gap-1\\.5 .text-ink")).map(
      (el) => el.textContent
    );
    expect(dates).toEqual(["📅 2026-09-20", "📅 2026-10-03"]);
  });

  it("이미 잡힌 날은 달력에도 점으로 표시한다", () => {
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20" })],
    });
    setup();

    expect(dayCell("20").querySelector(".rounded-full")).toBeTruthy();
    expect(dayCell("21").querySelector(".rounded-full")).toBeNull();
  });

  it("취소하면 그 일정만 지우고 알린다", async () => {
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20" })],
    });
    const { user } = setup();

    await user.click(within(scheduleRow("2026-09-20")).getByRole("button", { name: "취소" }));

    expect(removeSchedule).toHaveBeenCalledWith("s1");
    await waitFor(() => expect(useToastStore.getState().message).toBe("일정을 취소했어요"));
  });

  it("취소에 실패하면 조용히 끝내지 않고 사유를 알린다", async () => {
    removeSchedule.mockRejectedValue(new Error("서버 오류"));
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20" })],
    });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "취소" }));

    await waitFor(() => expect(useToastStore.getState().message).toContain("일정 취소에 실패했어요"));
  });
});

describe("새 날짜 고르기", () => {
  it("오늘을 기본으로 골라 둔다 — 대부분 가까운 날을 잡는다", () => {
    setup();

    expect(screen.getByText("📅 선택한 날짜: 2026-09-14")).toBeTruthy();
  });

  it("달력에서 누른 날로 바꾼다", async () => {
    const { user } = setup();

    await user.click(dayCell("25"));

    expect(screen.getByText("📅 선택한 날짜: 2026-09-25")).toBeTruthy();
  });
});

describe("등록", () => {
  it("고른 날짜로 등록하고 캘린더의 그 날로 데려간다", async () => {
    const { user } = setup();
    await user.click(dayCell("25"));

    await user.click(saveButton());

    expect(addSchedule).toHaveBeenCalledWith("c1", "2026-09-25");
    await waitFor(() => expect(useToastStore.getState().message).toBe("일정을 등록했어요"));
    expect(nav.push).toHaveBeenCalledWith("/schedule?tab=calendar&date=2026-09-25");
  });

  it("실패하면 화면을 떠나지 않고 사유만 알린다", async () => {
    addSchedule.mockRejectedValue(new Error("서버 오류"));
    const { user } = setup();

    await user.click(saveButton());

    await waitFor(() => expect(useToastStore.getState().message).toContain("일정 등록에 실패했어요"));
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("보내는 동안 버튼을 잠가 두 번 등록되지 않게 한다", async () => {
    let finish = () => {};
    addSchedule.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const { user } = setup();

    await user.click(saveButton());

    expect(saveButton().hasAttribute("disabled")).toBe(true);

    finish();
    await waitFor(() => expect(saveButton().hasAttribute("disabled")).toBe(false));
  });
});
