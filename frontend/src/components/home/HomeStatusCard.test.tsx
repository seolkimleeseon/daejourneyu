import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeStatusCard } from "@/components/home/HomeStatusCard";
import type { ActiveTrip } from "@/lib/schedule";
import { makePet, makeStop } from "@/test/fixtures";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const weather = vi.hoisted(() => ({ useWeather: vi.fn() }));
vi.mock("@/hooks/useWeather", () => ({ useWeather: weather.useWeather }));

const refetch = vi.fn().mockResolvedValue(undefined);

const forecast = {
  date: "2026-09-14",
  time: "15:00",
  temperatureC: 18,
  precipitationChancePercent: 10,
  precipitationType: 0,
  skyCondition: 1,
};

const trip: ActiveTrip = {
  ddayLabel: "D-3",
  courseLabel: "유성 산책 코스",
  ongoing: false,
  stops: [makeStop({ placeId: "a", name: "한밭수목원" })],
};

function setup(props: Partial<React.ComponentProps<typeof HomeStatusCard>> = {}) {
  render(
    <HomeStatusCard
      pet={null}
      isLoggedIn={false}
      upcomingTrip={null}
      tickerPlaces={[]}
      {...props}
    />
  );
  return { user: userEvent.setup() };
}

beforeEach(() => {
  vi.clearAllMocks();
  weather.useWeather.mockReturnValue({
    data: { district: "유성구", forecast: [forecast] },
    isFetching: false,
    isError: false,
    refetch,
  });
});

describe("인사말", () => {
  it("비로그인이면 일반 인사로 연다", () => {
    setup();

    expect(screen.getByText("오늘 대전 어디로 갈까요?")).toBeTruthy();
  });

  it("로그인했고 반려동물이 있으면 이름을 부른다", () => {
    setup({ isLoggedIn: true, pet: makePet({ name: "콩이" }) });

    expect(screen.getByText("콩이와 오늘은 어디로 갈까요?")).toBeTruthy();
  });

  it("로그인했어도 등록한 반려동물이 없으면 일반 인사로 둔다", () => {
    setup({ isLoggedIn: true, pet: null });

    expect(screen.getByText("오늘 대전 어디로 갈까요?")).toBeTruthy();
  });

  it("곧 갈 여정이 있으면 인사말 대신 코스 이름과 D-day를 앞세운다", () => {
    setup({ isLoggedIn: true, pet: makePet({ name: "콩이" }), upcomingTrip: trip });

    expect(screen.getByText("유성 산책 코스")).toBeTruthy();
    expect(screen.getByText("D-3")).toBeTruthy();
    expect(screen.queryByText("콩이와 오늘은 어디로 갈까요?")).toBeNull();
  });

  it("여정이 없으면 D-day 배지도 없다", () => {
    setup();

    expect(screen.queryByText(/^D-/)).toBeNull();
  });

  it("로그인 상태에서만 반려동물 이름표를 단다", () => {
    setup({ isLoggedIn: true, pet: makePet({ name: "콩이" }) });

    // 인사말과 이름표 두 곳에 이름이 나온다.
    expect(screen.getAllByText(/콩이/).length).toBeGreaterThan(1);
  });
});

describe("날씨", () => {
  it("현재 예보를 지역과 함께 요약한다", () => {
    setup();

    expect(screen.getByText(/☀️ 18°C · 맑음/)).toBeTruthy();
    expect(screen.getByText(/유성구/)).toBeTruthy();
  });

  it("불러오는 중이면 그렇게 알린다", () => {
    weather.useWeather.mockReturnValue({
      data: undefined,
      isFetching: true,
      isError: false,
      refetch,
    });
    setup();

    expect(screen.getByText(/날씨 불러오는 중…/)).toBeTruthy();
  });

  it("실패하면 카드를 비우지 않고 '정보 없음'으로 둔다", () => {
    weather.useWeather.mockReturnValue({
      data: undefined,
      isFetching: false,
      isError: true,
      refetch,
    });
    setup();

    // 지역을 모를 땐 대전으로 폴백한다(같은 줄에 함께 적힌다).
    expect(screen.getByText(/날씨 정보 없음 · 📍 대전/)).toBeTruthy();
  });

  it("새로고침 버튼이 다시 불러온다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "날씨 새로고침" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("불러오는 동안 아이콘을 돌려 눌렸다는 걸 보여준다", () => {
    weather.useWeather.mockReturnValue({
      data: { district: "유성구", forecast: [forecast] },
      isFetching: true,
      isError: false,
      refetch,
    });
    setup();

    expect(screen.getByRole("button", { name: "날씨 새로고침" }).className).toContain("animate-spin");
  });
});

describe("장소별 날씨 티커", () => {
  it("장소를 받으면 티커에 넘긴다", () => {
    setup({ tickerPlaces: [{ id: "p1", name: "한밭수목원", category: "산책" }] });

    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });

  it("불러오는 중이라는 사실도 함께 넘긴다", () => {
    setup({ tickerPlaces: [], tickerLoading: true });

    expect(screen.getByText(/모으고 있어요/)).toBeTruthy();
  });
});
