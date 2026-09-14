import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CrowdTicker } from "@/components/home/CrowdTicker";
import type { CrowdPlace } from "@/lib/crowd";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const ROW_HEIGHT = 36;
const INTERVAL_MS = 2200;

const places: CrowdPlace[] = [
  { id: "p1", name: "한밭수목원", category: "산책" },
  { id: "p2", name: "장태산자연휴양림", category: "산책" },
  { id: "p3", name: "댕댕카페", category: "맛집" },
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
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("빈 상태", () => {
  it("불러오는 중이면 모으고 있다고 알린다", () => {
    render(<CrowdTicker places={[]} loading />);

    expect(screen.getByText(/모으고 있어요/)).toBeTruthy();
  });

  it("다 불러왔는데 없으면 없다고 말한다 — 빈칸으로 두지 않는다", () => {
    render(<CrowdTicker places={[]} />);

    expect(screen.getByText("지금은 표시할 장소가 없어요")).toBeTruthy();
  });
});

describe("목록 표시", () => {
  it("장소 이름과 카테고리 아이콘을 함께 보여준다", () => {
    render(<CrowdTicker places={[places[0]]} />);

    expect(screen.getByText("한밭수목원")).toBeTruthy();
    expect(screen.getByText("🌳")).toBeTruthy();
  });

  it("혼잡도를 함께 표시한다", () => {
    render(<CrowdTicker places={[places[0]]} />);

    const levels = ["여유", "보통", "혼잡"];
    expect(levels.some((level) => screen.queryByText(level))).toBe(true);
  });

  it("한 곳뿐이면 복제하지 않는다 — 같은 줄이 두 번 보이면 이상하다", () => {
    render(<CrowdTicker places={[places[0]]} />);

    expect(screen.getAllByText("한밭수목원")).toHaveLength(1);
  });

  it("여러 곳이면 첫 항목을 끝에 한 번 더 둔다 — 무한 루프처럼 이어 보이게", () => {
    render(<CrowdTicker places={places} />);

    expect(screen.getAllByText("한밭수목원")).toHaveLength(2);
    expect(screen.getAllByText("댕댕카페")).toHaveLength(1);
  });
});

describe("자동 넘김", () => {
  it("일정 시간마다 다음 줄로 올린다", () => {
    const { container } = render(<CrowdTicker places={places} />);
    expect(trackTransform(container)).toBe("translateY(-0px)");

    act(() => vi.advanceTimersByTime(INTERVAL_MS));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT}px)`);

    act(() => vi.advanceTimersByTime(INTERVAL_MS));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT * 2}px)`);
  });

  it("한 곳뿐이면 넘기지 않는다", () => {
    const { container } = render(<CrowdTicker places={[places[0]]} />);

    act(() => vi.advanceTimersByTime(INTERVAL_MS * 3));

    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("복제한 줄까지 간 뒤 티 안 나게 처음으로 되돌린다", () => {
    const { container } = render(<CrowdTicker places={places} />);

    // 3칸을 넘기면 끝에 복제해둔 첫 항목 자리다.
    act(() => vi.advanceTimersByTime(INTERVAL_MS * 3));
    expect(trackTransform(container)).toBe(`translateY(-${ROW_HEIGHT * 3}px)`);

    // 트랜지션이 끝나고 나면 애니메이션 없이 0번으로 점프한다.
    act(() => vi.advanceTimersByTime(600));
    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("목록이 바뀌면 처음부터 다시 보여준다", () => {
    const { container, rerender } = render(<CrowdTicker places={places} />);
    act(() => vi.advanceTimersByTime(INTERVAL_MS));

    rerender(<CrowdTicker places={[...places].reverse()} />);

    expect(trackTransform(container)).toBe("translateY(-0px)");
  });

  it("화면에서 사라지면 타이머를 정리한다", () => {
    const { unmount } = render(<CrowdTicker places={places} />);

    unmount();

    expect(() => act(() => vi.advanceTimersByTime(INTERVAL_MS * 5))).not.toThrow();
  });
});

describe("이동", () => {
  it("줄을 누르면 그 장소 상세로 보낸다", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CrowdTicker places={[places[0]]} />);

    await user.click(screen.getByText("한밭수목원"));

    expect(nav.push).toHaveBeenCalledWith("/place/%ED%95%9C%EB%B0%AD%EC%88%98%EB%AA%A9%EC%9B%90");
  });

  it("카드 전체 클릭으로 전파하지 않는다 — 티커는 카드 안에 들어 있다", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onCardClick = vi.fn();
    render(
      <div onClick={onCardClick}>
        <CrowdTicker places={[places[0]]} />
      </div>
    );

    await user.click(screen.getByText("한밭수목원"));

    expect(nav.push).toHaveBeenCalled();
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
