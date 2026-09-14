import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { makeCourse, makeSchedule } from "@/test/fixtures";
import CourseVaultPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/schedule/vault" }));

// 서버 동기화는 자체 훅 테스트가 있다 — 여기선 스토어 상태를 직접 세워 화면만 본다.
vi.mock("@/hooks/useSyncCoursesFromApi", () => ({ useSyncCoursesFromApi: vi.fn() }));

const 산책코스 = makeCourse({ id: "c1", label: "유성 산책 코스", nights: 0 });
const 문화코스 = makeCourse({ id: "c2", label: "대전 문화 코스", nights: 1, source: "ai" });

function setup() {
  const view = render(<CourseVaultPage />);
  return { ...view, user: userEvent.setup() };
}

/** 보관함 카드를 위에서부터 이름 순서대로 읽는다. */
function cardLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".rounded-2xl.border.border-line .truncate")).map(
    (el) => el.textContent ?? ""
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useCourseStore.setState({ courses: [산책코스, 문화코스], schedules: [], hasSynced: true });
});

describe("들어갈 수 있는지", () => {
  it("비로그인이면 코스 대신 로그인 안내를 보여준다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("보관함에 담긴 코스는 로그인해야 볼 수 있어요")).toBeTruthy();
    expect(screen.queryByText("유성 산책 코스")).toBeNull();
  });

  it("아직 서버 목록을 못 받았으면 목데이터를 실제인 양 보여주지 않는다", () => {
    useCourseStore.setState({ hasSynced: false });
    setup();

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
    expect(screen.queryByText("유성 산책 코스")).toBeNull();
  });

  it("어느 상태에서도 제목과 뒤로가기는 남긴다 — 빠져나갈 길이 있어야 한다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("코스 보관함")).toBeTruthy();
    expect(screen.getByRole("button", { name: "‹ 뒤로" })).toBeTruthy();
  });
});

describe("코스 목록", () => {
  it("최근에 만든 코스를 위로 올린다", () => {
    const { container } = setup();

    expect(cardLabels(container)).toEqual(["대전 문화 코스", "유성 산책 코스"]);
  });

  it("몇 개 들어 있는지 적는다", () => {
    setup();

    expect(screen.getByText("보관함 코스 2개")).toBeTruthy();
  });

  it("비어 있으면 빈 칸 대신 코스를 만들어 보라고 한다", () => {
    useCourseStore.setState({ courses: [] });
    setup();

    expect(screen.getByText(/보관함이 비어 있어요/)).toBeTruthy();
    expect(screen.getByText("보관함 코스 0개")).toBeTruthy();
  });

  it("코스마다 등록된 일정 개수를 센다", () => {
    useCourseStore.setState({
      schedules: [
        makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20" }),
        makeSchedule({ id: "s2", courseId: "c1", date: "2026-09-21" }),
      ],
    });
    setup();

    expect(screen.getByText("📅 등록된 일정 2개 · 추가하기 ›")).toBeTruthy();
    expect(screen.getByText("📅 일정 추가하기 ›")).toBeTruthy();
  });
});

describe("이동", () => {
  it("카드를 누르면 그 코스 상세로 간다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("유성 산책 코스"));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/c1");
  });

  it("일정 추가 줄은 상세로 새지 않고 일정 등록으로 곧장 간다", async () => {
    const { user } = setup();

    await user.click(screen.getAllByRole("button", { name: /일정 추가하기/ })[0]);

    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith("/schedule/course/c2/schedule");
  });
});
