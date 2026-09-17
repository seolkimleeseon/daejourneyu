import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stableId } from "./stableId";

/*
 * 대전시 openapi2022 계열 다섯 데이터셋을 각각 우리 장소 모양으로 옮기는 파일이다.
 * 데이터셋마다 필드 이름이 제각각이고(좌표가 있는 것과 없는 것이 섞여 있다), 그 차이를
 * 어떻게 흡수하는지가 여기서 볼 값이다. 응답 봉투는 daejeonPlaces.ts가 이미 못박아 둔 모양을 쓴다.
 */
const openApi = vi.hoisted(() => ({ fetchDaejeonOpenApi: vi.fn() }));
vi.mock("./daejeonOpenApi", () => ({ fetchDaejeonOpenApi: openApi.fetchDaejeonOpenApi }));

const kakao = vi.hoisted(() => ({ geocodeAddress: vi.fn(), supplementImagesByName: vi.fn() }));
vi.mock("./kakaoLocal", () => ({
  geocodeAddress: kakao.geocodeAddress,
  supplementImagesByName: kakao.supplementImagesByName,
}));

/** 캐시가 모듈 전역 Map(TTL 24시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadDaejeonPlaces() {
  vi.resetModules();
  return import("./daejeonPlaces");
}

function giveItems(items: unknown[]) {
  openApi.fetchDaejeonOpenApi.mockResolvedValue({ response: { body: { totalCount: items.length, items } } });
}

beforeEach(() => {
  openApi.fetchDaejeonOpenApi.mockReset();
  kakao.geocodeAddress.mockReset();
  kakao.supplementImagesByName.mockReset();
  kakao.geocodeAddress.mockResolvedValue({ lat: 36.36, lng: 127.38 });
  kakao.supplementImagesByName.mockImplementation(async (list: unknown[]) => list);
  giveItems([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("모범음식점", () => {
  const restaurant = (overrides: Record<string, string> = {}) => ({
    restrntNm: "대전국밥",
    restrntAddr: "대전광역시 중구 대종로 1",
    mapLat: "36.32",
    mapLot: "127.42",
    ...overrides,
  });

  it("좌표를 이미 갖고 있어 지오코딩을 부르지 않는다", async () => {
    giveItems([restaurant()]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonExemplaryRestaurants();

    expect(first).toEqual({
      id: stableId("restaurant", "대전국밥", "대전광역시 중구 대종로 1"),
      name: "대전국밥",
      category: "맛집",
      district: "중구",
      address: "대전광역시 중구 대종로 1",
      lat: 36.32,
      lng: 127.42,
      imageUrl: null,
    });
    expect(kakao.geocodeAddress).not.toHaveBeenCalled();
  });

  it("주소에서 구를 읽어내 붙인다", async () => {
    giveItems([restaurant({ restrntAddr: "대전광역시 대덕구 중리로 1" })]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonExemplaryRestaurants();

    expect(first.district).toBe("대덕구");
  });

  it("대전 5개 구가 아니면 뺀다 — 인접 지역이 섞여 온다", async () => {
    giveItems([restaurant({ restrntNm: "세종집", restrntAddr: "세종특별자치시 한누리대로 1" }), restaurant()]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    const places = await fetchDaejeonExemplaryRestaurants();

    expect(places.map((place) => place.name)).toEqual(["대전국밥"]);
  });

  it("좌표가 없으면 뺀다 — 지도에 못 꽂는다", async () => {
    giveItems([restaurant({ restrntNm: "좌표없음", mapLat: "", mapLot: "" }), restaurant()]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    const places = await fetchDaejeonExemplaryRestaurants();

    expect(places.map((place) => place.name)).toEqual(["대전국밥"]);
  });

  it("mapLat이 위도, mapLot이 경도다", async () => {
    giveItems([restaurant({ mapLat: "36.9", mapLot: "127.1" })]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonExemplaryRestaurants();

    expect(first).toMatchObject({ lat: 36.9, lng: 127.1 });
  });

  it("본문이 비어 있어도 빈 목록으로 돌려준다", async () => {
    openApi.fetchDaejeonOpenApi.mockResolvedValue({});
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    await expect(fetchDaejeonExemplaryRestaurants()).resolves.toEqual([]);
  });
});

describe("문화시설", () => {
  const culture = (overrides: Record<string, string> = {}) => ({
    signgu: "서구",
    fcltyNm: "대전예술의전당",
    locplc: "둔산대로 135",
    ...overrides,
  });

  it("좌표가 없어 주소를 대전 주소로 만들어 지오코딩한다", async () => {
    giveItems([culture()]);
    const { fetchDaejeonCultureFacilities } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonCultureFacilities();

    expect(kakao.geocodeAddress).toHaveBeenCalledWith("대전 둔산대로 135");
    expect(first).toMatchObject({ name: "대전예술의전당", category: "문화", lat: 36.36, lng: 127.38 });
  });

  it("구는 주소가 아니라 별도 칸에서 읽는다 — 이 데이터셋엔 구 칸이 따로 있다", async () => {
    giveItems([culture({ signgu: "동구" })]);
    const { fetchDaejeonCultureFacilities } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonCultureFacilities();

    expect(first.district).toBe("동구");
  });

  it("대전 5개 구가 아니면 지오코딩도 시키지 않고 뺀다", async () => {
    giveItems([culture({ signgu: "세종시" })]);
    const { fetchDaejeonCultureFacilities } = await loadDaejeonPlaces();

    await expect(fetchDaejeonCultureFacilities()).resolves.toEqual([]);
    expect(kakao.geocodeAddress).not.toHaveBeenCalled();
  });

  it("좌표를 못 찾은 곳만 빠지고 나머지는 살린다", async () => {
    giveItems([culture({ fcltyNm: "주소불명" }), culture({ fcltyNm: "정상" })]);
    kakao.geocodeAddress.mockResolvedValueOnce(null);
    const { fetchDaejeonCultureFacilities } = await loadDaejeonPlaces();

    const places = await fetchDaejeonCultureFacilities();

    expect(places.map((place) => place.name)).toEqual(["정상"]);
  });
});

describe("숙박", () => {
  const lodging = (overrides: Record<string, string> = {}) => ({
    romsNm: "유성호텔",
    romsAddr: "대전광역시 유성구 온천북로 1",
    ...overrides,
  });

  it("숙박 카테고리로 옮기고 주소 그대로 지오코딩한다", async () => {
    giveItems([lodging()]);
    const { fetchDaejeonLodgings } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonLodgings();

    expect(kakao.geocodeAddress).toHaveBeenCalledWith("대전광역시 유성구 온천북로 1");
    expect(first).toMatchObject({ name: "유성호텔", category: "숙박", district: "유성구" });
  });
});

describe("쇼핑", () => {
  const shopping = (overrides: Record<string, string> = {}) => ({
    shppgNm: "중앙시장",
    shppgAddr: "대전광역시 동구 중앙로 1",
    mapLat: "36.33",
    mapLot: "127.43",
    ...overrides,
  });

  it("쇼핑은 문화로 묶는다 — 앱에 쇼핑 카테고리가 따로 없다", async () => {
    giveItems([shopping()]);
    const { fetchDaejeonShopping } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonShopping();

    expect(first).toMatchObject({ name: "중앙시장", category: "문화", district: "동구" });
  });
});

describe("관광지", () => {
  const tourspot = (overrides: Record<string, string> = {}) => ({
    tourspotNm: "장태산자연휴양림",
    tourspotAddr: "대전광역시 서구 장안로 461",
    mapLat: "36.23",
    mapLot: "127.32",
    ...overrides,
  });

  it("산책 카테고리로 묶는다 — 관광공사 데이터와 같은 나들이류다", async () => {
    giveItems([tourspot()]);
    const { fetchDaejeonTourspots } = await loadDaejeonPlaces();

    const [first] = await fetchDaejeonTourspots();

    expect(first).toMatchObject({ category: "산책", lat: 36.23, lng: 127.32 });
    expect(kakao.geocodeAddress).not.toHaveBeenCalled();
  });

  it("좌표가 비어 있는 것만 주소로 다시 찾는다 — 상당수는 좌표를 갖고 있다", async () => {
    giveItems([tourspot({ tourspotNm: "좌표없음", mapLat: "0", mapLot: "0" }), tourspot()]);
    const { fetchDaejeonTourspots } = await loadDaejeonPlaces();

    const places = await fetchDaejeonTourspots();

    expect(kakao.geocodeAddress).toHaveBeenCalledTimes(1);
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({ name: "좌표없음", lat: 36.36, lng: 127.38 });
  });

  it("좌표도 없고 주소로도 못 찾으면 뺀다", async () => {
    giveItems([tourspot({ tourspotNm: "못찾음", mapLat: "0", mapLot: "0" })]);
    kakao.geocodeAddress.mockResolvedValue(null);
    const { fetchDaejeonTourspots } = await loadDaejeonPlaces();

    await expect(fetchDaejeonTourspots()).resolves.toEqual([]);
  });
});

describe("사진 보충", () => {
  it("카테고리 힌트를 붙여 검색한다 — 이름+구만으론 무관한 사진이 잡힌다", async () => {
    giveItems([
      { restrntNm: "대전국밥", restrntAddr: "대전광역시 중구 대종로 1", mapLat: "36.32", mapLot: "127.42" },
    ]);
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    await fetchDaejeonExemplaryRestaurants();

    const [, buildQuery, limit] = kakao.supplementImagesByName.mock.lastCall as [
      unknown[],
      (p: { district: string; name: string; category: string }) => string,
      number,
    ];
    expect(buildQuery({ district: "중구", name: "대전국밥", category: "맛집" })).toBe("대전 중구 대전국밥 맛집");
    expect(buildQuery({ district: "서구", name: "한밭수목원", category: "산책" })).toBe("대전 서구 한밭수목원 공원");
    expect(limit).toBe(80);
  });
});

describe("캐시", () => {
  it("같은 데이터셋은 한 번만 가져온다", async () => {
    const { fetchDaejeonExemplaryRestaurants } = await loadDaejeonPlaces();

    await fetchDaejeonExemplaryRestaurants();
    await fetchDaejeonExemplaryRestaurants();

    expect(openApi.fetchDaejeonOpenApi).toHaveBeenCalledTimes(1);
  });

  it("데이터셋마다 캐시를 따로 둔다 — 섞이면 엉뚱한 목록이 온다", async () => {
    const { fetchDaejeonExemplaryRestaurants, fetchDaejeonShopping } = await loadDaejeonPlaces();

    await fetchDaejeonExemplaryRestaurants();
    await fetchDaejeonShopping();

    expect(openApi.fetchDaejeonOpenApi.mock.calls.map(([dataset]) => dataset)).toEqual(["restaurant", "shopping"]);
  });
});
