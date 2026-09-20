import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaceWeatherTicker } from "@/components/home/PlaceWeatherTicker";
import type { TickerPlace } from "@/lib/placeTicker";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const weather = vi.hoisted(() => ({ useWeather: vi.fn() }));
vi.mock("@/hooks/useWeather", () => ({ useWeather: weather.useWeather }));

const ROW_HEIGHT = 36;
const INTERVAL_MS = 2200;

const forecast = {
  date: "2026-09-14",
  time: "15:00",
  temperatureC: 18,
  precipitationChancePercent: 10,
  precipitationType: 0,
  skyCondition: 1,
};

const places: TickerPlace[] = [
  { id: "p1", name: "한밭수목원", category: "산책", lat: 36.36, lng: 127.38 },
  { id: "p2", name: "장태산자연휴양림", category: "산책", lat: 36.28, lng: 127.33 },
  { id: "p3", name: "댕댕카페", category: "맛집", lat: 36.35, lng: 127.39 },
];

/** 슬라이드 트랙의 현재 위치 — 몇 번째 줄을 보고 있는지가 여기 담긴다. */
function trackTransform(container: HTMLElement): string {
  return (container.querySelector(".flex-col") as HTMLElement).style.transform;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  weather.useWeather.mockReturnValue({ data: { district: "유성구", forecast: [forecast] }, isPending: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("빈 상태", () => {
  it("불러오는 중이면 모으고 있다고 알린다", () => {
    render(<PlaceWeatherTicker places={[]} loading />);

    expect(screen.getByText(/모으고 있어요/)).toBeTruthy();
  });

  it("다 불러왔는데 없으면 없다고 말한다 — 빈칸으로 두지 않는다", () => {
    render(<PlaceWeatherTicker places={[]} />);

    expect(screen.getByText("지금은 표시할 장소가 없어요")).toBeTruthy();
  });
});

describe("목록 표시", () => {
  it("장소 이름과 카테고리 아이콘을 함께 보여준다", () => {
    render(<PlaceWeatherTicker places={[places[0]]} />);

    expect(screen.getByText("한밭수목원")).toBeTruthy();
    expect(screen.getByText("🌳")).toBeTruthy();
  });

  it("그 장소 좌표 기준 날씨를 함께 표시한다", () => {
    render(<PlaceWeatherTicker places={[places[0]]} />);

    expect(weather.useWeather).toHaveBeenCalledWith({ lat: 36.36, lng: 127.38, enabled: true });
    expect(screen.getByText("☀️ 18°C")).toBeTruthy();
  });

  it("좌표가 없는 장소(코스에서 온 장소)는 날씨 대신 상세보기 안내를 보인다", () => {
    weather.useWeather.mockReturnValue({ data: undefined, isPending: true });
    render(<PlaceWeatherTicker places={[{ id: "a", name: "갑천", category: "산책" }]} />);

    expect(weather.useWeather).toHaveBeenCalledWith({ lat: undefined, lng: undefined, enabled: false });
    expect(screen.queryByText(/°C/)).toBeNull();
    expect(screen.getByText("상세보기")).toBeTruthy();
  });

  it("좌표가 있어도 아직 불러오는 중이면 상세보기를 기본값으로 보여준다 — 자리 자체가 비었다 채워지면 깜빡여 보인다", () => {
    weather.useWeather.mockReturnValue({ data: undefined, isPending: true });
    render(<PlaceWeatherTicker places={[places[0]]} />);

    expect(screen.queryByText(/°C/)).toBeNull();
    expect(screen.getByText("상세보기")).toBeTruthy();
  });

  it("좌표는 있는데 날씨를 못 불러왔으면 상세보기 안내로 대신 채운다", () => {
    weather.useWeather.mockReturnValue({ data: undefined, isPending: false });
    render(<PlaceWeatherTicker places={[places[0]]} />);

    expect(screen.getByText("상세보기")).toBeTruthy();
  });

  it("한 곳뿐이면 복제하지 않는다 — 같은 줄이 두 번 보이면 이상하다", () => {
    render(<PlaceWeatherTicker places={[places[0]]} />);

    expect(screen.getAllByText("한밭수목원")).toHaveLength(1);
  });

  it("여러 곳이면 첫 항목을 끝에 한 번 더 둔다 — 무한 루프처럼 이어 보이게", () => {
    render(<PlaceWeatherTicker places={places} />);

    expect(screen.getAllByText("한밭수목원")).toHaveLength(2);
    expect(screen.getAllByText("댕댕카페")).toHaveLength(1);
  });
});

describe("자동 넘김", () => {
  it("일정 시간마다 다음 줄로 올린다", () => {
    const { container } = render(<PlaceWeatherTicker places={places} />);
    expect(trackTransform(container)).toBe("translateY(-0px)");

    act(() => vi.advanceTimersByTime(INTERVAL_MS));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT}px)`);

    act(() => vi.advanceTimersByTime(INTERVAL_MS));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT * 2}px)`);
  });

  it("한 곳뿐이면 넘기지 않는다", () => {
    const { container } = render(<PlaceWeatherTicker places={[places[0]]} />);

    act(() => vi.advanceTimersByTime(INTERVAL_MS * 3));

    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("복제한 줄까지 간 뒤 티 안 나게 처음으로 되돌린다", () => {
    const { container } = render(<PlaceWeatherTicker places={places} />);

    // 3칸을 넘기면 끝에 복제해둔 첫 항목 자리다.
    act(() => vi.advanceTimersByTime(INTERVAL_MS * 3));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT * 3}px)`);

    // 트랜지션이 끝나고 나면 애니메이션 없이 0번으로 점프한다.
    act(() => vi.advanceTimersByTime(600));
    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("목록이 바뀌면 처음부터 다시 보여준다", () => {
    const { container, rerender } = render(<PlaceWeatherTicker places={places} />);
    act(() => vi.advanceTimersByTime(INTERVAL_MS));

    rerender(<PlaceWeatherTicker places={[...places].reverse()} />);

    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("화면에서 사라지면 타이머를 정리한다", () => {
    const { unmount } = render(<PlaceWeatherTicker places={places} />);

    unmount();

    expect(() => act(() => vi.advanceTimersByTime(INTERVAL_MS * 5))).not.toThrow();
  });
});

describe("이동", () => {
  it("줄을 누르면 그 장소 상세로 보낸다", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<PlaceWeatherTicker places={[places[0]]} />);

    await user.click(screen.getByText("한밭수목원"));

    expect(nav.push).toHaveBeenCalledWith("/place/%ED%95%9C%EB%B0%AD%EC%88%98%EB%AA%A9%EC%9B%90?id=p1");
  });

  it("카드 전체 클릭으로 전파하지 않는다 — 티커는 카드 안에 들어 있다", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCardClick = vi.fn();
    render(
      <div onClick={onCardClick}>
        <PlaceWeatherTicker places={[places[0]]} />
      </div>
    );

    await user.click(screen.getByText("한밭수목원"));

    expect(nav.push).toHaveBeenCalled();
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
