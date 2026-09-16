import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlacePickerSheet } from "@/components/course/PlacePickerSheet";
import type { KakaoSearchTarget } from "@/hooks/useKakaoPlaces";
import type { PickablePlace } from "@/lib/petTourMapper";
import { useSheetStore } from "@/stores/useSheetStore";
import { makePlace } from "@/test/fixtures";

const pickable = vi.hoisted(() => ({ usePickablePlaces: vi.fn() }));
vi.mock("@/hooks/usePickablePlaces", () => ({ usePickablePlaces: pickable.usePickablePlaces }));

const kakao = vi.hoisted(() => ({ useKakaoPlacesMulti: vi.fn() }));
vi.mock("@/hooks/useKakaoPlaces", () => ({ useKakaoPlacesMulti: kakao.useKakaoPlacesMulti }));

function makePickable(overrides: Partial<PickablePlace> = {}): PickablePlace {
  return { ...makePlace(), imageUrl: null, ...overrides };
}

const 한밭수목원 = makePickable({ id: "p1", name: "한밭수목원", district: "서구", category: "산책" });
const 댕댕카페 = makePickable({ id: "p2", name: "댕댕카페", district: "유성구", category: "맛집" });
const 시립미술관 = makePickable({ id: "p3", name: "시립미술관", district: "서구", category: "문화" });

function givePlaces(places: PickablePlace[], extra: Record<string, unknown> = {}) {
  pickable.usePickablePlaces.mockReturnValue({ data: places, isLoading: false, isError: false, ...extra });
}

function giveKakao(places: PickablePlace[] = [], isLoading = false) {
  kakao.useKakaoPlacesMulti.mockReturnValue({ places, isLoading });
}

/** 카카오에 실제로 넘어간 검색 목록 — 어떤 카테고리를 보충하려 했는지가 여기 담긴다. */
function kakaoTargets(): KakaoSearchTarget[] {
  return kakao.useKakaoPlacesMulti.mock.lastCall?.[0] ?? [];
}

function kakaoEnabled(): boolean {
  return kakao.useKakaoPlacesMulti.mock.lastCall?.[1] ?? false;
}

/** 구역(동반 인증 / 다른 지역 / 카카오)마다 카드 이름을 순서대로 모은다. */
function gridNames(container: HTMLElement): string[][] {
  return Array.from(container.querySelectorAll("div.grid")).map((grid) =>
    Array.from(grid.querySelectorAll("button .p-2 .font-bold")).map((el) => el.textContent ?? "")
  );
}

function setup() {
  const view = render(<PlacePickerSheet />);
  return { ...view, user: userEvent.setup() };
}

beforeEach(() => {
  vi.clearAllMocks();
  useSheetStore.setState({ isOpen: true, title: "장소 선택", selected: [], onDone: null });
  givePlaces([한밭수목원, 댕댕카페, 시립미술관]);
  giveKakao();
});

afterEach(() => {
  // @ts-expect-error 테스트에서 끼워 넣은 것만 되돌린다.
  delete navigator.geolocation;
});

describe("불러오는 상태", () => {
  it("불러오는 중이면 그렇게 알린다", () => {
    givePlaces(undefined as unknown as PickablePlace[], { isLoading: true });
    const { container } = setup();

    expect(container.textContent).toContain("실시간 반려동물 동반여행지를 불러오는 중이에요");
  });

  it("실패하면 못 불러왔다고 알린다 — 0곳이라고 속이지 않는다", () => {
    givePlaces(undefined as unknown as PickablePlace[], { isError: true });
    const { container } = setup();

    expect(container.textContent).toContain("실시간 장소를 불러오지 못했어요");
    expect(container.textContent).not.toContain("동반 인증 · 0곳");
  });

  it("시트가 닫혀 있으면 목록도 카카오도 부르지 않는다", () => {
    useSheetStore.setState({ isOpen: false });
    setup();

    expect(pickable.usePickablePlaces).toHaveBeenLastCalledWith(false);
    expect(kakaoEnabled()).toBe(false);
  });
});

describe("걸러 보기", () => {
  it("전체로 열면 받은 장소를 다 보여주고 개수를 적는다", () => {
    const { container } = setup();

    expect(gridNames(container)[0]).toEqual(["한밭수목원", "댕댕카페", "시립미술관"]);
    expect(container.textContent).toContain("동반 인증 · 3곳");
  });

  it("이름으로 검색한다", async () => {
    const { container, user } = setup();

    await user.type(screen.getByPlaceholderText(/장소·지역 검색/), "댕댕");

    expect(gridNames(container)[0]).toEqual(["댕댕카페"]);
  });

  it("지역 이름으로도 검색된다 — 사용자는 '유성구'라고 친다", async () => {
    const { container, user } = setup();

    await user.type(screen.getByPlaceholderText(/장소·지역 검색/), "유성구");

    expect(gridNames(container)[0]).toEqual(["댕댕카페"]);
  });

  it("카테고리 칩으로 좁힌다", async () => {
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "🍔 맛집" }));

    expect(gridNames(container)[0]).toEqual(["댕댕카페"]);
  });

  it("구 칩으로 좁힌다", async () => {
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "서구" }));

    expect(gridNames(container)[0]).toEqual(["한밭수목원", "시립미술관"]);
  });

  it("아무것도 안 걸리면 빈 격자 대신 이유를 적는다", async () => {
    const { container, user } = setup();

    await user.type(screen.getByPlaceholderText(/장소·지역 검색/), "없는장소");

    expect(container.textContent).toContain("검색 결과가 없어요");
  });

  it("구를 걸어 비었으면 그 구를 짚어서 알린다", async () => {
    givePlaces([한밭수목원]);
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "대덕구" }));

    expect(container.textContent).toContain("대덕구엔 조건에 맞는 장소가 아직 적어요");
  });
});

describe("정렬", () => {
  const 미인증 = makePickable({ id: "a", name: "나중장소", sourceTier: 2 });
  const 인증 = makePickable({ id: "b", name: "가장장소", sourceTier: 1 });
  const 카카오 = makePickable({ id: "kakao-9", name: "다중장소" });

  it("기본은 동반 인증 소스를 앞세우고 카카오 검색 결과를 맨 뒤로 민다", () => {
    givePlaces([미인증, 카카오, 인증]);
    const { container } = setup();

    expect(gridNames(container)[0]).toEqual(["가장장소", "나중장소", "다중장소"]);
  });

  it("같은 등급이면 사진 있는 카드를 먼저 보여준다", () => {
    givePlaces([
      makePickable({ id: "a", name: "사진없음", sourceTier: 1 }),
      makePickable({ id: "b", name: "사진있음", sourceTier: 1, imageUrl: "https://img/1.jpg" }),
    ]);
    const { container } = setup();

    expect(gridNames(container)[0]).toEqual(["사진있음", "사진없음"]);
  });

  it("이름순을 고르면 가나다로 다시 세운다", async () => {
    givePlaces([미인증, 카카오, 인증]);
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "이름순" }));

    expect(gridNames(container)[0]).toEqual(["가장장소", "나중장소", "다중장소"]);
  });

  it("거리순은 가까운 곳부터 세운다", async () => {
    givePlaces([
      makePickable({ id: "far", name: "먼곳", lat: 37.5, lng: 127.0 }),
      makePickable({ id: "near", name: "가까운곳", lat: 36.36, lng: 127.38 }),
    ]);
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 36.36, longitude: 127.38 } } as GeolocationPosition),
      },
      configurable: true,
    });
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "거리순" }));

    expect(gridNames(container)[0]).toEqual(["가까운곳", "먼곳"]);
  });

  it("위치를 못 받으면 기본순으로 되돌리고 그 사실을 알린다", async () => {
    givePlaces([
      makePickable({ id: "far", name: "먼곳", lat: 37.5, lng: 127.0 }),
      makePickable({ id: "near", name: "가까운곳", lat: 36.36, lng: 127.38 }),
    ]);
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition: (_ok: PositionCallback, fail: () => void) => fail() },
      configurable: true,
    });
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "거리순" }));

    expect(container.textContent).toContain("위치 접근이 안 돼서 기본순으로 보여드려요");
    expect(gridNames(container)[0]).toEqual(["먼곳", "가까운곳"]);
  });
});

describe("더 보기", () => {
  const many = Array.from({ length: 25 }, (_, i) =>
    makePickable({ id: `p${i}`, name: `장소${String(i).padStart(2, "0")}` })
  );

  it("한 번에 다 그리지 않고 20곳까지만 보여준다", () => {
    givePlaces(many);
    const { container } = setup();

    expect(gridNames(container)[0]).toHaveLength(20);
    expect(screen.getByRole("button", { name: "더 보기 · 5곳 남음" })).toBeTruthy();
  });

  it("더 보기를 누르면 나머지를 마저 붙이고 버튼을 거둔다", async () => {
    givePlaces(many);
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: /더 보기/ }));

    expect(gridNames(container)[0]).toHaveLength(25);
    expect(screen.queryByRole("button", { name: /더 보기/ })).toBeNull();
  });

  it("조건을 바꾸면 이전 필터의 더 보기 진행분은 버린다", async () => {
    givePlaces(many);
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: /더 보기/ }));

    await user.click(screen.getByRole("button", { name: "이름순" }));

    expect(gridNames(container)[0]).toHaveLength(20);
  });

  it("20곳 이하면 더 보기를 두지 않는다", () => {
    setup();

    expect(screen.queryByRole("button", { name: /더 보기/ })).toBeNull();
  });
});

describe("다른 지역 보충", () => {
  it("구를 걸어 결과가 적으면 대전 다른 지역 장소도 아래에 덧붙인다", async () => {
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "유성구" }));

    expect(container.textContent).toContain("유성구 결과가 적어서 대전 다른 지역 장소도 같이 보여드려요");
    expect(gridNames(container)[0]).toEqual(["댕댕카페"]);
    expect(gridNames(container)[1]).toEqual(["한밭수목원", "시립미술관"]);
  });

  it("고른 카테고리는 풀지 않는다 — 푸는 건 구 조건뿐이다", async () => {
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "🏛️ 문화" }));
    await user.click(screen.getByRole("button", { name: "유성구" }));

    expect(gridNames(container)[1]).toEqual(["시립미술관"]);
  });

  it("구를 안 걸었으면 보충하지 않는다 — 풀 조건이 없다", () => {
    const { container } = setup();

    expect(container.textContent).not.toContain("다른 지역 장소도 같이");
  });

  it("그 구에 이미 충분하면 보충하지 않는다", async () => {
    givePlaces(
      Array.from({ length: 4 }, (_, i) => makePickable({ id: `s${i}`, name: `서구${i}`, district: "서구" }))
        .concat(makePickable({ id: "y1", name: "유성장소", district: "유성구" }))
    );
    const { container, user } = setup();

    await user.click(screen.getByRole("button", { name: "서구" }));

    expect(container.textContent).not.toContain("다른 지역 장소도 같이");
  });
});

describe("카카오맵 보충", () => {
  it("장소가 적은 카테고리만 골라 카카오에 물어본다", () => {
    // 산책만 넉넉하고 나머지는 비어 있는 상태.
    givePlaces(
      Array.from({ length: 5 }, (_, i) =>
        makePickable({ id: `w${i}`, name: `산책${i}`, category: "산책" })
      )
    );
    setup();

    expect(kakaoTargets().map((target) => target.category)).toEqual(["놀이터", "맛집", "문화"]);
  });

  it("카테고리마다 실제로 결과가 나오는 검색어를 쓴다", () => {
    givePlaces([]);
    setup();

    expect(kakaoTargets().map((target) => target.query)).toEqual([
      "대전 공원",
      "대전 반려동물 놀이터",
      "대전 애견동반 맛집",
      "대전 문화시설",
    ]);
  });

  it("모든 카테고리가 넉넉하면 카카오를 아예 켜지 않는다", () => {
    givePlaces(
      ["산책", "놀이터", "맛집", "문화"].flatMap((category, c) =>
        Array.from({ length: 4 }, (_, i) =>
          makePickable({ id: `${c}-${i}`, name: `${category}${i}`, category: category as never })
        )
      )
    );
    setup();

    expect(kakaoTargets()).toEqual([]);
    expect(kakaoEnabled()).toBe(false);
  });

  it("검색어를 치면 카테고리 단어 대신 그 검색어로 물어본다 — DB에 없는 곳도 찾게", async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText(/장소·지역 검색/), "갑천");

    expect(kakaoTargets()).toEqual([{ category: "문화", query: "대전 갑천" }]);
  });

  it("구를 같이 걸었으면 검색어에 구도 얹는다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "유성구" }));
    await user.type(screen.getByPlaceholderText(/장소·지역 검색/), "갑천");

    expect(kakaoTargets()).toEqual([{ category: "문화", query: "대전 유성구 갑천" }]);
  });

  it("찾아보는 중이라는 것도 알린다", () => {
    giveKakao([], true);
    const { container } = setup();

    expect(container.textContent).toContain("카카오맵에서 더 찾아보는 중이에요");
  });

  it("카카오 결과는 확인이 필요하다고 못박아 따로 묶어 보여준다", () => {
    giveKakao([makePickable({ id: "kakao-1", name: "카카오카페" })]);
    const { container } = setup();

    expect(container.textContent).toContain("반려동물 동반 가능 여부는 방문 전 확인해주세요");
    expect(gridNames(container)[1]).toEqual(["카카오카페"]);
  });

  it("이미 목록에 있는 이름은 카카오 결과에서 뺀다 — 같은 곳이 두 번 뜨면 안 된다", () => {
    giveKakao([
      makePickable({ id: "kakao-1", name: "한밭수목원" }),
      makePickable({ id: "kakao-2", name: "카카오카페" }),
    ]);
    const { container } = setup();

    expect(gridNames(container)[1]).toEqual(["카카오카페"]);
  });
});

describe("담기", () => {
  it("카드를 누르면 담고, 다시 누르면 뺀다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("댕댕카페"));
    expect(useSheetStore.getState().selected.map((place) => place.id)).toEqual(["p2"]);

    await user.click(screen.getByText("댕댕카페"));
    expect(useSheetStore.getState().selected).toEqual([]);
  });

  it("담은 카드에는 체크 표시를 얹는다", () => {
    useSheetStore.setState({ selected: [댕댕카페] });
    setup();

    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("하나도 안 담았으면 완료를 막고 무엇을 하라는지 적는다", () => {
    setup();

    const done = screen.getByRole("button", { name: "장소를 선택해 담아보세요" });
    expect(done.hasAttribute("disabled")).toBe(true);
  });

  it("담은 개수를 완료 버튼에 적는다", () => {
    useSheetStore.setState({ selected: [한밭수목원, 댕댕카페] });
    setup();

    expect(screen.getByRole("button", { name: /✓ 2곳 담았어요 · 완료/ })).toBeTruthy();
  });

  it("완료를 누르면 고른 장소를 넘기고 시트를 닫는다", async () => {
    const onDone = vi.fn();
    useSheetStore.setState({ selected: [댕댕카페], onDone });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /완료/ }));

    expect(onDone).toHaveBeenCalledWith([댕댕카페]);
    expect(useSheetStore.getState().isOpen).toBe(false);
  });
});

describe("카드 표시", () => {
  it("동반 불가인 곳은 눈에 띄게 표시한다", () => {
    givePlaces([makePickable({ id: "x", name: "출입금지공원", petFriendly: false })]);
    setup();

    expect(screen.getByText("🚫 동반 불가")).toBeTruthy();
  });

  it("사진이 깨지면 깨진 아이콘 대신 카테고리 이모지로 조용히 바꾼다", () => {
    givePlaces([makePickable({ id: "x", name: "사진장소", imageUrl: "https://img/gone.jpg" })]);
    const { container } = setup();
    // 카테고리 칩에도 같은 이모지가 있어 카드 안으로 범위를 좁힌다 — 카드엔 처음엔 배지 하나뿐이다.
    const card = container.querySelector("div.grid button") as HTMLElement;
    // 사진 영역만 본다 — 카드 하단의 구 표기(📍)도 Emoji3D라 <img>를 하나 더 갖고 있다.
    const photoArea = card.querySelector(".aspect-\\[4\\/3\\]") as HTMLElement;
    expect(within(card).getAllByText(/🌳/)).toHaveLength(1);

    fireEvent.error(photoArea.querySelector("img") as HTMLImageElement);

    expect(photoArea.querySelector("img")).toBeNull();
    expect(within(card).getAllByText(/🌳/)).toHaveLength(2);
  });
});
