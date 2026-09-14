import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makePlace } from "@/test/fixtures";
import MapPage from "./page";

const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/map",
  useSearchParams: () => search.params,
}));

const places = vi.hoisted(() => ({ usePlaces: vi.fn() }));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: places.usePlaces }));

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원", district: "서구", condition: "전 견종 · 목줄 필수" });
const 댕댕카페 = makePlace({ id: "p2", name: "댕댕카페", district: "서구", category: "맛집", condition: "소형견만 가능" });

function givePlaces(list = [한밭수목원, 댕댕카페], isLoading = false) {
  places.usePlaces.mockReturnValue({ data: list, isLoading });
}

function setup() {
  const view = render(<MapPage />);
  return { ...view, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) };
}

/** 목록 카드를 위에서부터 이름 순서대로 읽는다. */
function cardNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("div.grid button .p-2 .font-bold")).map(
    (el) => el.textContent ?? ""
  );
}

/** 마지막으로 usePlaces에 넘어간 필터. */
function lastFilter() {
  return places.usePlaces.mock.lastCall?.[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  search.params = new URLSearchParams();
  givePlaces();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("구 고르기", () => {
  it("구를 안 골랐으면 지도부터 보여준다", () => {
    setup();

    expect(screen.getByText("어느 구를 다녀볼까요?")).toBeTruthy();
    expect(screen.queryByText("한밭수목원")).toBeNull();
  });

  it("구 선택 화면에는 '구 다시 선택'을 두지 않는다 — 이미 그 화면이다", () => {
    setup();

    expect(screen.queryByRole("button", { name: "구 다시 선택" })).toBeNull();
  });

  it("구를 누르면 그 구 목록으로 보낸다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /유성구/ }));

    expect(nav.push).toHaveBeenCalledWith("/map?district=%EC%9C%A0%EC%84%B1%EA%B5%AC");
  });

  it("대전에 없는 구가 주소에 실려 와도 목록을 열지 않는다", () => {
    search.params = new URLSearchParams("district=강남구");
    setup();

    expect(screen.getByText("어느 구를 다녀볼까요?")).toBeTruthy();
    expect(lastFilter()).toMatchObject({ district: null });
  });
});

describe("강아지 이동 연출", () => {
  it("구를 새로 고르면 목록 전에 강아지가 달려간다", async () => {
    const { user, rerender } = setup();

    await user.click(screen.getByRole("button", { name: /유성구/ }));
    // 라우터는 mock이라 주소가 저절로 안 바뀐다 — 이동 결과를 직접 반영해준다.
    search.params = new URLSearchParams("district=유성구");
    rerender(<MapPage />);

    expect(screen.getByText(/유성구/)).toBeTruthy();
    expect(screen.queryByText("한밭수목원")).toBeNull();

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });

  it("뒤로가기로 목록에 돌아올 땐 연출을 건너뛴다", () => {
    search.params = new URLSearchParams("district=유성구");
    setup();

    expect(screen.getByText("한밭수목원")).toBeTruthy();
  });
});

describe("장소 목록", () => {
  beforeEach(() => {
    search.params = new URLSearchParams("district=서구");
  });

  it("고른 구를 서버 조회 조건으로 넘긴다", () => {
    setup();

    expect(lastFilter()).toMatchObject({ district: "서구", category: null });
  });

  it("불러오는 중이면 그렇게 알린다", () => {
    givePlaces([], true);
    setup();

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
  });

  it("그 구에 아무것도 없으면 구 이름을 짚어 알린다", () => {
    givePlaces([]);
    setup();

    expect(screen.getByText("서구에 조건에 맞는 장소가 아직 없어요.")).toBeTruthy();
  });

  it("장소가 없으면 검색창도 두지 않는다 — 걸러낼 게 없다", () => {
    givePlaces([]);
    setup();

    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("카테고리 칩은 히스토리를 쌓지 않고 갈아끼운다 — 뒤로가기 한 번에 구 선택으로 나가야 한다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "맛집" }));

    expect(nav.replace).toHaveBeenCalledWith("/map?district=%EC%84%9C%EA%B5%AC&category=%EB%A7%9B%EC%A7%91");
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("전체로 되돌리면 카테고리만 뺀다", async () => {
    search.params = new URLSearchParams("district=서구&category=맛집");
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "전체" }));

    expect(nav.replace).toHaveBeenCalledWith("/map?district=%EC%84%9C%EA%B5%AC");
  });

  it("구 다시 선택으로 처음으로 돌아간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "구 다시 선택" }));

    expect(nav.push).toHaveBeenCalledWith("/map");
  });
});

describe("목록 안에서 더 좁히기", () => {
  beforeEach(() => {
    search.params = new URLSearchParams("district=서구");
  });

  it("이름으로 걸러낸다", async () => {
    const { container, user } = setup();

    await user.type(screen.getByRole("searchbox"), "댕댕");

    expect(cardNames(container)).toEqual(["댕댕카페"]);
  });

  it("동반 조건으로도 걸러낸다 — '소형견'만 기억나는 경우가 있다", async () => {
    const { container, user } = setup();

    await user.type(screen.getByRole("searchbox"), "소형견");

    expect(cardNames(container)).toEqual(["댕댕카페"]);
  });

  it("검색으로 다 걸러지면 검색어를 짚어 알린다 — 구에 장소가 없는 것과는 다르다", async () => {
    const { user } = setup();

    await user.type(screen.getByRole("searchbox"), "없는곳");

    expect(screen.getByText("‘없는곳’ 검색 결과가 없어요.")).toBeTruthy();
  });

  it("구를 옮기면 이전 구에서 치던 검색어를 비운다", async () => {
    const { container, user, rerender } = setup();
    await user.type(screen.getByRole("searchbox"), "댕댕");

    search.params = new URLSearchParams("district=유성구");
    rerender(<MapPage />);

    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
    expect(cardNames(container)).toHaveLength(2);
  });
});

describe("더 보기", () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    makePlace({ id: `p${i}`, name: `장소${String(i).padStart(2, "0")}`, district: "서구" })
  );

  beforeEach(() => {
    search.params = new URLSearchParams("district=서구");
    givePlaces(many);
  });

  it("한 번에 다 그리지 않고 20곳까지만 보여준다", () => {
    const { container } = setup();

    expect(cardNames(container)).toHaveLength(20);
    expect(screen.getByRole("button", { name: "더 보기 · 5곳 남음" })).toBeTruthy();
  });

  it("더 보기를 누르면 나머지를 마저 붙이고 버튼을 거둔다", async () => {
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: /더 보기/ }));

    expect(cardNames(container)).toHaveLength(25);
    expect(screen.queryByRole("button", { name: /더 보기/ })).toBeNull();
  });

  it("검색어를 치면 이전 진행분은 버린다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: /더 보기/ }));

    await user.type(screen.getByRole("searchbox"), "장소");

    expect(cardNames(container)).toHaveLength(20);
  });
});
