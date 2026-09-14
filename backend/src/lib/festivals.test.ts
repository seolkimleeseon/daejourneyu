import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 이 API엔 "축제 자체가 반려동물 동반 가능한가"가 없다 — 행사 좌표 인근에 반려동반 인증
 * 장소가 있는지로 대신 표시할 뿐이다. 그 경계(무엇을 근거로 삼고 무엇을 안 삼는가)가 여기서
 * 볼 값이다. 응답 봉투는 festivals.ts가 이미 타입으로 못박아 둔 모양을 쓴다.
 */
const fetchMock = vi.fn();

const places = vi.hoisted(() => ({ fetchAggregatedPlaces: vi.fn() }));
vi.mock("./placesAggregator", () => ({ fetchAggregatedPlaces: places.fetchAggregatedPlaces }));

/** 캐시가 모듈 전역 Map이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadFestivals() {
  vi.resetModules();
  return import("./festivals");
}

function festival(overrides: Record<string, string> = {}) {
  return {
    contentid: "2001",
    title: "대전 0시 축제",
    addr1: "대전광역시 중구 중앙로",
    addr2: "으능정이거리",
    eventstartdate: "20260801",
    eventenddate: "20260809",
    mapx: "127.4270",
    mapy: "36.3280",
    firstimage: "https://img/festival.jpg",
    tel: "042-000-0000",
    ...overrides,
  };
}

function envelope(items: unknown[]) {
  return {
    response: {
      header: { resultCode: "00", resultMsg: "OK" },
      body: { items: { item: items }, numOfRows: items.length, pageNo: 1, totalCount: items.length },
    },
  };
}

function jsonOf(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

/** 목록 요청에는 축제를, 상세(detailCommon2) 요청에는 홈페이지 항목을 돌려준다. */
function giveFestivals(items: unknown[], common: unknown[] = []) {
  fetchMock.mockImplementation(async (url: string) =>
    String(url).includes("detailCommon2") ? jsonOf(envelope(common)) : jsonOf(envelope(items))
  );
}

/** 인증 장소 하나를 놓는다 — 축제 좌표에서 얼마나 떨어뜨릴지 미터로 준다. */
function placeNear(meters: number, overrides: Record<string, unknown> = {}) {
  return {
    name: "으능정이공원",
    category: "산책",
    petFriendly: true,
    lat: 36.328 + meters / 111_000,
    lng: 127.427,
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  places.fetchAggregatedPlaces.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  places.fetchAggregatedPlaces.mockResolvedValue([]);
  giveFestivals([festival()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("축제 정보로 바꾸기", () => {
  it("응답 항목을 화면이 쓰는 모양으로 옮긴다", async () => {
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first).toMatchObject({
      id: "2001",
      title: "대전 0시 축제",
      date: "2026-08-01",
      endDate: "2026-08-09",
      place: "으능정이거리",
      address: "대전광역시 중구 중앙로 으능정이거리",
      lat: 36.328,
      lng: 127.427,
      imageUrl: "https://img/festival.jpg",
      tel: "042-000-0000",
    });
  });

  it("끝나는 날이 없으면 당일 행사로 본다", async () => {
    giveFestivals([festival({ eventenddate: "" })]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.endDate).toBe(first.date);
  });

  it("시작일이 없거나 여덟 자리가 아니면 아예 버린다 — 캘린더에 꽂을 수 없다", async () => {
    giveFestivals([
      festival({ contentid: "no-date", eventstartdate: "" }),
      festival({ contentid: "short", eventstartdate: "2026" }),
      festival({ contentid: "ok" }),
    ]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const festivals = await fetchDaejeonFestivals();

    expect(festivals.map((f) => f.id)).toEqual(["ok"]);
  });

  it("상세 주소가 없으면 기본 주소를 장소명으로 쓴다", async () => {
    giveFestivals([festival({ addr2: "" })]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.place).toBe("대전광역시 중구 중앙로");
    expect(first.address).toBe("대전광역시 중구 중앙로");
  });

  it("좌표가 없으면 null로 둔다 — 0으로 채우면 지도 밖에 꽂힌다", async () => {
    giveFestivals([festival({ mapx: "", mapy: "" })]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first).toMatchObject({ lat: null, lng: null });
  });

  it("대전 시도코드로만 물어보고, 과거 3개월~미래 1년 창을 건다", async () => {
    const { fetchDaejeonFestivals } = await loadFestivals();

    await fetchDaejeonFestivals();

    const params = new URL(String(fetchMock.mock.calls[0][0])).searchParams;
    expect(params.get("lDongRegnCd")).toBe("30");
    const start = params.get("eventStartDate")!;
    const end = params.get("eventEndDate")!;
    const days = (n: string) => new Date(`${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}`).getTime();
    expect(Math.round((days(end) - days(start)) / 86_400_000)).toBe(455);
  });
});

describe("행사장 인증 표시", () => {
  it("도보권 안에 인증된 공원이 있으면 근거가 된 장소명과 함께 표시한다", async () => {
    places.fetchAggregatedPlaces.mockResolvedValue([placeNear(100)]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first).toMatchObject({ venuePetFriendly: true, venuePlaceName: "으능정이공원" });
  });

  it("도보권을 벗어나면 표시하지 않는다", async () => {
    places.fetchAggregatedPlaces.mockResolvedValue([placeNear(1000)]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first).toMatchObject({ venuePetFriendly: false, venuePlaceName: null });
  });

  it("근처 카페·문화시설은 근거로 삼지 않는다 — 옆 가게가 행사장 출입을 보장하진 않는다", async () => {
    places.fetchAggregatedPlaces.mockResolvedValue([
      placeNear(50, { name: "댕댕카페", category: "맛집" }),
      placeNear(50, { name: "시립미술관", category: "문화" }),
    ]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.venuePetFriendly).toBe(false);
  });

  it("공원이어도 동반 불가인 곳은 근거가 안 된다", async () => {
    places.fetchAggregatedPlaces.mockResolvedValue([placeNear(50, { petFriendly: false })]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.venuePetFriendly).toBe(false);
  });

  it("좌표 없는 축제는 견줄 기준이 없어 건너뛴다", async () => {
    giveFestivals([festival({ mapx: "", mapy: "" })]);
    places.fetchAggregatedPlaces.mockResolvedValue([placeNear(10)]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.venuePetFriendly).toBe(false);
  });

  it("장소 목록을 못 불러와도 축제는 보여준다 — 인증 뱃지만 안 뜨면 된다", async () => {
    places.fetchAggregatedPlaces.mockRejectedValue(new Error("장소 조회 실패"));
    const { fetchDaejeonFestivals } = await loadFestivals();

    const festivals = await fetchDaejeonFestivals();

    expect(festivals).toHaveLength(1);
    expect(festivals[0].venuePetFriendly).toBe(false);
  });
});

describe("홈페이지 보강", () => {
  it("HTML 링크로 와도 주소만 뽑아낸다 — 이 필드는 <a>로 오는 경우가 섞여 있다", async () => {
    giveFestivals([festival()], [{ homepage: '<a href="https://0si.kr" target="_blank">대전 0시 축제</a>' }]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.webUrl).toBe("https://0si.kr");
  });

  it("순수 URL로 와도 그대로 쓴다", async () => {
    giveFestivals([festival()], [{ homepage: "https://0si.kr" }]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.webUrl).toBe("https://0si.kr");
  });

  it("주소 같지 않은 값은 링크로 만들지 않는다", async () => {
    giveFestivals([festival()], [{ homepage: "홈페이지 없음" }]);
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first.webUrl).toBeNull();
  });

  it("홈페이지 조회가 터져도 축제 목록은 그대로 돌려준다 — 링크 버튼만 안 뜨면 된다", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("detailCommon2")
        ? new Response("", { status: 500, statusText: "Server Error" })
        : jsonOf(envelope([festival()]))
    );
    const { fetchDaejeonFestivals } = await loadFestivals();

    const [first] = await fetchDaejeonFestivals();

    expect(first).toMatchObject({ title: "대전 0시 축제", webUrl: null });
  });
});

describe("열쇠와 캐시", () => {
  it("열쇠가 없으면 어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonFestivals } = await loadFestivals();

    await expect(fetchDaejeonFestivals()).rejects.toThrow(/backend\/.env/);
  });

  it("목록은 한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonFestivals } = await loadFestivals();

    await fetchDaejeonFestivals();
    await fetchDaejeonFestivals();

    const listCalls = fetchMock.mock.calls.filter(([url]) => !String(url).includes("detailCommon2"));
    expect(listCalls).toHaveLength(1);
  });
});
