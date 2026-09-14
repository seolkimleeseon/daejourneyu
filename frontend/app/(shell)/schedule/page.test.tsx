import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { makeCourse, makeMbtiResult, makePet, makeSchedule } from "@/test/fixtures";
import SchedulePage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/schedule",
  useSearchParams: () => search.params,
}));

vi.mock("@/hooks/useSyncCoursesFromApi", () => ({ useSyncCoursesFromApi: vi.fn() }));

/** 캘린더는 자체 테스트가 있다 — 이 탭이 언제 캘린더로 넘기는지만 본다. */
vi.mock("@/components/course/ScheduleCalendar", () => ({
  ScheduleCalendar: ({ initialDate }: { initialDate?: string }) => (
    <div data-testid="calendar">{initialDate ?? "오늘"}</div>
  ),
}));

const courses = Array.from({ length: 6 }, (_, i) =>
  makeCourse({ id: `c${i}`, label: `코스${i}` })
);

function setup() {
  const view = render(<SchedulePage />);
  return { ...view, user: userEvent.setup() };
}

/** 보관함 카드를 위에서부터 이름 순서대로 읽는다. */
function cardLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".rounded-2xl.border.border-line .truncate")).map(
    (el) => el.textContent ?? ""
  );
}

const tile = (name: string | RegExp) => screen.getByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  search.params = new URLSearchParams();
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  usePetStore.setState({ pets: [], activePetIndex: 0 });
  useCourseStore.setState({ courses: [courses[0], courses[1]], schedules: [], hasSynced: true });
});

describe("세그먼트", () => {
  it("기본은 내 코스로 연다", () => {
    setup();

    expect(screen.getByText("코스 만들기")).toBeTruthy();
    expect(screen.queryByTestId("calendar")).toBeNull();
  });

  it("캘린더 링크로 들어오면 캘린더를 펴서 연다 — 한 번 더 누르게 하지 않는다", () => {
    search.params = new URLSearchParams("tab=calendar");
    setup();

    expect(screen.getByTestId("calendar")).toBeTruthy();
  });

  it("날짜까지 실려 오면 그 날을 골라 연다", () => {
    search.params = new URLSearchParams("tab=calendar&date=2026-10-03");
    setup();

    expect(screen.getByTestId("calendar").textContent).toBe("2026-10-03");
  });

  it("탭을 눌러 오가며 본다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "캘린더" }));
    expect(screen.getByTestId("calendar")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "내 코스" }));
    expect(screen.queryByTestId("calendar")).toBeNull();
  });
});

describe("코스 만들기 타일", () => {
  it("세 갈래 입구를 나란히 둔다", () => {
    setup();

    expect(tile(/MBTI 맞춤 코스/)).toBeTruthy();
    expect(tile(/AI에게 물어보기/)).toBeTruthy();
    expect(tile(/직접 짓기/)).toBeTruthy();
  });

  it("검사 전이면 성향 테스트부터 하라고 안내한다", () => {
    setup();

    expect(screen.getByText("성향 테스트로 코스 자동 생성")).toBeTruthy();
  });

  it("검사 결과가 있으면 그 유형으로 바로 추천받게 한다", async () => {
    usePetStore.setState({ pets: [makePet({ mbti: makeMbtiResult({ code: "ENFP" }) })], activePetIndex: 0 });
    const { user } = setup();

    expect(screen.getByText("ENFP로 바로 추천받기")).toBeTruthy();

    await user.click(tile(/MBTI 맞춤 코스/));
    expect(nav.push).toHaveBeenCalledWith("/schedule/course/new/mbti?quick=1");
  });

  it("비로그인이면 저장된 결과가 있어도 지름길을 열지 않는다 — 남의 결과일 수 있다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    usePetStore.setState({ pets: [makePet({ mbti: makeMbtiResult({ code: "ENFP" }) })], activePetIndex: 0 });
    const { user } = setup();

    await user.click(tile(/MBTI 맞춤 코스/));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/new/mbti");
  });

  it("AI 상담과 직접 짓기로도 보낸다", async () => {
    const { user } = setup();

    await user.click(tile(/AI에게 물어보기/));
    expect(nav.push).toHaveBeenCalledWith("/home/chatbot");

    await user.click(tile(/직접 짓기/));
    expect(nav.push).toHaveBeenLastCalledWith("/schedule/course/new/manual");
  });
});

describe("보관함 미리보기", () => {
  it("비로그인이면 코스 만들기는 남기고 보관함만 로그인으로 막는다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("보관함에 저장한 코스를 보려면 로그인해주세요")).toBeTruthy();
    expect(tile(/직접 짓기/)).toBeTruthy();
  });

  it("아직 서버 목록을 못 받았으면 목데이터를 실제인 양 보여주지 않는다", () => {
    useCourseStore.setState({ hasSynced: false });
    setup();

    expect(screen.getByText("코스 보관함을 불러오는 중…")).toBeTruthy();
    expect(screen.queryByText("코스0")).toBeNull();
  });

  it("최근에 만든 코스를 위로 올린다", () => {
    const { container } = setup();

    expect(cardLabels(container)).toEqual(["코스1", "코스0"]);
  });

  it("미리보기는 5개까지만 — 탭 첫 화면이 보관함으로 덮이면 안 된다", () => {
    useCourseStore.setState({ courses });
    const { container } = setup();

    expect(cardLabels(container)).toHaveLength(5);
    expect(screen.getByRole("button", { name: "코스 보관함 전체 보기 (6개) ›" })).toBeTruthy();
  });

  it("다 보이면 아래쪽 전체 보기 버튼은 두지 않는다", () => {
    setup();

    expect(screen.queryByRole("button", { name: /코스 보관함 전체 보기/ })).toBeNull();
  });

  it("전체 보기로 보관함에 간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "전체 보기 ›" }));

    expect(nav.push).toHaveBeenCalledWith("/schedule/vault");
  });

  it("비어 있으면 전체 보기 대신 첫 코스를 만들어 보라고 한다", () => {
    useCourseStore.setState({ courses: [] });
    setup();

    expect(screen.getByText(/첫 코스를 만들어보세요/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "전체 보기 ›" })).toBeNull();
  });

  it("코스마다 등록된 일정 개수를 센다", () => {
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1", courseId: "c0", date: "2026-09-20" })],
    });
    setup();

    expect(screen.getByText("📅 등록된 일정 1개 · 추가하기 ›")).toBeTruthy();
  });

  it("카드와 일정 추가 줄이 서로 다른 곳으로 보낸다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("코스0"));
    expect(nav.push).toHaveBeenLastCalledWith("/schedule/course/c0");

    await user.click(screen.getAllByRole("button", { name: /일정 추가하기/ })[0]);
    expect(nav.push).toHaveBeenLastCalledWith("/schedule/course/c1/schedule");
  });
});
