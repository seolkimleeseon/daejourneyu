import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMyBadges } from "@/hooks/useMyBadges";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { makeCourse, makePet, makeReview, makeSchedule, makeStop } from "@/test/fixtures";

const hooks = vi.hoisted(() => ({
  useReviews: vi.fn(),
  useMyPosts: vi.fn(),
  usePlaces: vi.fn(),
  useArticleLikes: vi.fn(),
  useSyncCoursesFromApi: vi.fn(),
}));

vi.mock("@/hooks/useReviews", () => ({ useReviews: hooks.useReviews }));
vi.mock("@/hooks/usePosts", () => ({ useMyPosts: hooks.useMyPosts }));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: hooks.usePlaces }));
vi.mock("@/hooks/useArticleLikes", () => ({ useArticleLikes: hooks.useArticleLikes }));
vi.mock("@/hooks/useSyncCoursesFromApi", () => ({
  useSyncCoursesFromApi: hooks.useSyncCoursesFromApi,
}));

const reviews = [makeReview({ id: "mine", isMine: true }), makeReview({ id: "other", isMine: false })];

beforeEach(() => {
  vi.clearAllMocks();
  // 일정이 '다녀온' 것인지는 오늘 날짜로 가르므로 날짜만 고정한다.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 14, 12));

  hooks.useReviews.mockReturnValue({ data: reviews });
  hooks.useMyPosts.mockReturnValue({ data: [] });
  hooks.usePlaces.mockReturnValue({ data: [] });
  hooks.useArticleLikes.mockReturnValue({ data: { counts: {}, likedIds: [] } });

  const course = makeCourse({
    id: "c1",
    days: [
      [
        makeStop({ placeId: "a", district: "유성구" }),
        makeStop({ placeId: "b", district: "동구" }),
        makeStop({ placeId: "c", district: "대덕구" }),
        makeStop({ placeId: "d", district: "서구" }),
      ],
    ],
  });
  useCourseStore.setState({
    courses: [course],
    schedules: [makeSchedule({ courseId: "c1", date: "2026-08-01" })],
    hasSynced: true,
  });
  usePetStore.setState({ pets: [makePet()], activePetIndex: 0 });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMyBadges", () => {
  it("스토어·훅 데이터를 모아 뱃지를 계산하고 코앞인 뱃지와 문장을 고른다", () => {
    const { result } = renderHook(() => useMyBadges());

    expect(hooks.useMyPosts).toHaveBeenCalledWith("recent", true);
    expect(hooks.useSyncCoursesFromApi).toHaveBeenCalled();

    const { badges, got, gotCount, total, nearest, nearestMessage } = result.current;
    expect(total).toBe(badges.length);
    expect(gotCount).toBe(got.length);
    expect(got.map((badge) => badge.id)).toEqual(
      expect.arrayContaining(["first-owner", "review-king", "first-journey", "pet-profile", "one-day-expedition"])
    );
    // 4개 구를 밟았고 중구 하나만 남았다.
    expect(nearest?.id).toBe("dj-full-round");
    expect(nearestMessage).toBe("중구만 가면 대전 한바퀴 완성");
  });

  it("비로그인이면 내 글을 요청하지 않고 첫 반려인 뱃지도 없다", () => {
    useAuthStore.setState({ isLoggedIn: false });

    const { result } = renderHook(() => useMyBadges());

    expect(hooks.useMyPosts).toHaveBeenCalledWith("recent", false);
    expect(result.current.got.some((badge) => badge.id === "first-owner")).toBe(false);
  });

  it("비로그인이면 스토어의 목데이터 코스를 내 기록으로 세지 않는다", () => {
    useAuthStore.setState({ isLoggedIn: false });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.got.some((badge) => badge.id === "first-journey")).toBe(false);
  });

  it("서버 목록을 받기 전에는 초기값 코스를 세지 않는다", () => {
    useCourseStore.setState({ hasSynced: false });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.got.some((badge) => badge.id === "first-journey")).toBe(false);
  });

  it("코앞인 뱃지가 없으면 문장도 비운다", () => {
    useCourseStore.setState({ courses: [], schedules: [] });
    usePetStore.setState({ pets: [], activePetIndex: 0 });
    hooks.useReviews.mockReturnValue({ data: [] });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.nearest).toBeNull();
    expect(result.current.nearestMessage).toBe("");
  });

  it("아티클에 누른 도움돼요 수로 이웃사랑을 센다", () => {
    hooks.useArticleLikes.mockReturnValue({ data: { counts: {}, likedIds: ["a", "b", "c"] } });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.got.map((badge) => badge.id)).toContain("neighbor-love");
  });
});

describe("반려동물별 집계", () => {
  const mongi = makePet({ id: "pet-mongi", name: "몽이" });
  const bori = makePet({ id: "pet-bori", name: "보리" });
  const stops = [makeStop({ placeId: "a", district: "유성구" })];

  function setup(activeIndex: number) {
    useCourseStore.setState({
      courses: [
        makeCourse({ id: "with-mongi", petId: "pet-mongi", days: [stops] }),
        makeCourse({ id: "with-bori", petId: "pet-bori", days: [stops] }),
        makeCourse({ id: "legacy", petId: null, days: [stops] }),
      ],
      schedules: [
        makeSchedule({ id: "s1", courseId: "with-mongi", date: "2026-08-01" }),
        makeSchedule({ id: "s2", courseId: "with-bori", date: "2026-08-02" }),
        makeSchedule({ id: "s3", courseId: "legacy", date: "2026-08-03" }),
      ],
      hasSynced: true,
    });
    usePetStore.setState({ pets: [mongi, bori], activePetIndex: activeIndex });
    return renderHook(() => useMyBadges());
  }

  it("활성 반려동물과 만든 코스와, 주인을 모르는 옛 코스만 센다", () => {
    const { result } = setup(0);

    // 몽이 몫(1) + 옛 코스(1) = 다녀온 일정 2개.
    expect(result.current.badges.find((badge) => badge.id === "traveler")?.current).toBe(2);
  });

  it("다른 반려동물로 바꾸면 그 반려동물 몫으로 다시 센다", () => {
    const { result } = setup(1);

    expect(result.current.badges.find((badge) => badge.id === "traveler")?.current).toBe(2);
  });

  it("반려동물이 없으면 코스를 거르지 않는다", () => {
    usePetStore.setState({ pets: [], activePetIndex: 0 });
    useCourseStore.setState({
      courses: [makeCourse({ id: "x", petId: "pet-mongi", days: [stops] })],
      schedules: [makeSchedule({ id: "s", courseId: "x", date: "2026-08-01" })],
      hasSynced: true,
    });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.badges.find((badge) => badge.id === "traveler")?.current).toBe(1);
  });
});

describe("ready — 숫자를 그려도 되는지", () => {
  it("모든 데이터를 받았으면 true", () => {
    const { result } = renderHook(() => useMyBadges());

    expect(result.current.ready).toBe(true);
  });

  it("후기를 받아오는 중이면 false — 숫자가 계속 바뀌는 걸 그리지 않게", () => {
    hooks.useReviews.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.ready).toBe(false);
  });

  it("세션 확인 전이거나 코스를 아직 못 받았으면 false", () => {
    useAuthStore.setState({ hydrated: false });
    expect(renderHook(() => useMyBadges()).result.current.ready).toBe(false);

    useAuthStore.setState({ hydrated: true });
    useCourseStore.setState({ hasSynced: false });
    expect(renderHook(() => useMyBadges()).result.current.ready).toBe(false);
  });

  it("코스 목록을 받는 데 실패해도 무한 로딩에 갇히지 않는다", () => {
    useCourseStore.setState({ hasSynced: false });
    hooks.useSyncCoursesFromApi.mockReturnValue({ coursesFailed: true });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.ready).toBe(true);
    // 못 받은 코스는 목데이터로 대신 세지 않는다.
    expect(result.current.got.some((badge) => badge.id === "first-journey")).toBe(false);
  });

  it("비로그인은 셀 게 없어 세션만 확인되면 true", () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true });

    const { result } = renderHook(() => useMyBadges());

    expect(result.current.ready).toBe(true);
  });
});
