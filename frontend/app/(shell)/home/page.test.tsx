import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TickerPlace } from "@/lib/placeTicker";
import type { ActiveTrip } from "@/lib/schedule";
import type { Pet } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { makeCourse, makeMbtiResult, makePet, makePlace, makeSchedule, makeStop } from "@/test/fixtures";
import HomePage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/home" }));

const places = vi.hoisted(() => ({ usePlaces: vi.fn() }));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: places.usePlaces }));

vi.mock("@/hooks/useSyncCoursesFromApi", () => ({ useSyncCoursesFromApi: vi.fn() }));

/** 상태 카드는 자체 테스트가 있다 — 홈이 무엇을 넘겨주는지만 들여다본다. */
const status = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/home/HomeStatusCard", () => ({
  HomeStatusCard: (props: Record<string, unknown>) => {
    status.render(props);
    return <div data-testid="status-card" />;
  },
}));

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원" });
const 댕댕카페 = makePlace({ id: "p2", name: "댕댕카페", category: "맛집" });
const 출입금지공원 = makePlace({ id: "p3", name: "출입금지공원", petFriendly: false });

function setup() {
  const view = render(<HomePage />);
  return { ...view, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) };
}

interface StatusCardProps {
  pet: Pet | null;
  isLoggedIn: boolean;
  upcomingTrip: ActiveTrip | null;
  tickerPlaces: TickerPlace[];
  tickerLoading?: boolean;
}

/** 상태 카드에 마지막으로 넘어간 값. */
function statusProps(): StatusCardProps {
  return status.render.mock.lastCall?.[0] as StatusCardProps;
}

const tile = (name: string | RegExp) => screen.getByRole("button", { name });

/** 로그인 모달은 닫혀 있어도 DOM에 남는다 — 열림 여부는 오버레이 불투명도로 본다. */
function loginModalOpen(): boolean {
  return screen.getByText("로그인이 필요해요").closest(".fixed")?.className.includes("opacity-100") ?? false;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00"));
  // 섞기가 들어 있어 순서를 고정해야 무엇이 담기는지 확인할 수 있다.
  vi.spyOn(Math, "random").mockReturnValue(0);
  places.usePlaces.mockReturnValue({ data: [한밭수목원, 댕댕카페, 출입금지공원], isPending: false });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  usePetStore.setState({ pets: [makePet({ name: "콩이" })], activePetIndex: 0 });
  useCourseStore.setState({ courses: [], schedules: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("게스트 배너", () => {
  it("로그인했으면 띄우지 않는다", () => {
    setup();

    expect(screen.queryByText(/로그인하면 코스 저장/)).toBeNull();
  });

  it("비로그인이면 무엇이 잠겨 있는지 알린다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("🔒 로그인하면 코스 저장 · 후기 작성이 가능해요")).toBeTruthy();
  });

  it("✕로 닫으면 로그인 창을 열지 않고 배너만 접는다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();

    await user.click(screen.getByText("✕"));

    expect(screen.queryByText(/로그인하면 코스 저장/)).toBeNull();
    expect(loginModalOpen()).toBe(false);
  });

  it("배너를 누르면 로그인 창을 연다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();

    await user.click(screen.getByText(/로그인하면 코스 저장/));

    expect(loginModalOpen()).toBe(true);
  });
});

describe("상태 카드에 넘기는 값", () => {
  it("활성 반려동물과 로그인 여부를 그대로 넘긴다", () => {
    setup();

    expect(statusProps()).toMatchObject({ isLoggedIn: true, pet: expect.objectContaining({ name: "콩이" }) });
  });

  it("곧 갈 여정이 있으면 그 여정과 그 코스의 장소를 넘긴다", () => {
    useCourseStore.setState({
      courses: [makeCourse({ id: "c1", label: "유성 산책 코스", days: [[makeStop({ placeId: "a", name: "갑천" })]] })],
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-17" })],
    });
    setup();

    expect(statusProps().upcomingTrip).toMatchObject({ ddayLabel: "D-3", courseLabel: "유성 산책 코스" });
    expect(statusProps().tickerPlaces).toEqual([{ id: "a", name: "갑천", category: "산책" }]);
  });

  it("비로그인이면 여정을 찾지 않는다 — 남의 일정일 수 있다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    useCourseStore.setState({
      courses: [makeCourse({ id: "c1" })],
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-17" })],
    });
    setup();

    expect(statusProps().upcomingTrip).toBeNull();
  });

  it("여정이 없으면 동반 가능한 곳으로 채우고 동반 불가는 뺀다", () => {
    setup();

    // 매번 다른 순서로 섞어 보여주는 게 의도라 순서는 따지지 않는다.
    const names = statusProps().tickerPlaces.map((place) => place.name);
    expect([...names].sort()).toEqual(["댕댕카페", "한밭수목원"]);
  });

  it("장소를 불러오는 중이라는 사실도 함께 넘긴다", () => {
    places.usePlaces.mockReturnValue({ data: undefined, isPending: true });
    setup();

    expect(statusProps()).toMatchObject({ tickerLoading: true });
  });

  it("여정이 있으면 장소를 기다리지 않는다 — 보여줄 게 이미 있다", () => {
    places.usePlaces.mockReturnValue({ data: undefined, isPending: true });
    useCourseStore.setState({
      courses: [makeCourse({ id: "c1" })],
      schedules: [makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-17" })],
    });
    setup();

    expect(statusProps()).toMatchObject({ tickerLoading: false });
  });
});

describe("바로 가기", () => {
  it("가장 최근 아티클 하나를 띄우고 그 글로 보낸다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("최신 아티클 · 보기"));

    expect(nav.push).toHaveBeenCalledWith(expect.stringMatching(/^\/article\//));
  });

  it("검사 전이면 MBTI 타일이 테스트로 보낸다", async () => {
    const { user } = setup();

    expect(screen.getByText("여행 성향 알아보기")).toBeTruthy();
    await user.click(tile(/내 반려동물 MBTI/));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/new/mbti");
  });

  it("검사 결과가 있으면 결과 보기로 바꾸고 지름길로 보낸다", async () => {
    usePetStore.setState({ pets: [makePet({ mbti: makeMbtiResult({ code: "ENFP" }) })], activePetIndex: 0 });
    const { user } = setup();

    expect(screen.getByText("ENFP · 결과 보기")).toBeTruthy();
    await user.click(tile(/내 반려동물 MBTI/));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/new/mbti?quick=1");
  });

  it("챗봇과 축제 캘린더로도 보낸다", async () => {
    const { user } = setup();

    await user.click(tile(/오늘 어디 갈까\?/));
    expect(nav.push).toHaveBeenCalledWith("/home/chatbot");

    await user.click(tile(/축제 일정 보기/));
    expect(nav.push).toHaveBeenLastCalledWith("/home/festival");
  });
});
