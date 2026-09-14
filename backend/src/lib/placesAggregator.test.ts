import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 소스 8곳을 전부 mock해 "정규화·필터·dedupe" 규칙만 본다.
 * 실제 공공데이터 호출은 여기서 확인할 수 없다 — 각 소스 모듈이 무엇을 주는지는 별개 관심사다.
 */
const sources = vi.hoisted(() => ({
  petTourSpots: vi.fn(),
  petFacilities: vi.fn(),
  verifiedRestaurants: vi.fn(),
  parks: vi.fn(),
  culture: vi.fn(),
  lodgings: vi.fn(),
  tourspots: vi.fn(),
  exemplaryRestaurants: vi.fn(),
  shopping: vi.fn(),
  campgrounds: vi.fn(),
  petAcp: [] as unknown[],
  dogParks: [] as unknown[],
  assertKakaoRestKey: vi.fn(),
  fetchPlaceImage: vi.fn(),
}));

vi.mock("./petTourSpots", () => ({ fetchDaejeonPetTourSpots: sources.petTourSpots }));
vi.mock("./petFacilities", () => ({ fetchDaejeonPetFacilities: sources.petFacilities }));
vi.mock("./verifiedPetRestaurants", () => ({
  fetchVerifiedPetRestaurants: sources.verifiedRestaurants,
}));
vi.mock("./parks", () => ({ fetchDaejeonParks: sources.parks }));
vi.mock("./daejeonPlaces", () => ({
  fetchDaejeonCultureFacilities: sources.culture,
  fetchDaejeonLodgings: sources.lodgings,
  fetchDaejeonTourspots: sources.tourspots,
  fetchDaejeonExemplaryRestaurants: sources.exemplaryRestaurants,
  fetchDaejeonShopping: sources.shopping,
}));
vi.mock("./campgrounds", () => ({ fetchDaejeonCampgrounds: sources.campgrounds }));
vi.mock("./petAcpFacilities", () => ({
  get PET_ACP_FACILITIES() {
    return sources.petAcp;
  },
}));
vi.mock("./daejeonDogParks", () => ({
  get DAEJEON_DOG_PARKS() {
    return sources.dogParks;
  },
}));
vi.mock("./kakaoLocal", () => ({
  assertKakaoRestKey: sources.assertKakaoRestKey,
  fetchPlaceImage: sources.fetchPlaceImage,
}));

import { fetchAggregatedPlaces } from "./placesAggregator";

function petTourSpot(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    name: "한밭수목원",
    contentTypeId: "12",
    address: "대전광역시 서구 둔산대로 169",
    lat: 36.36,
    lng: 127.38,
    imageUrl: "https://img/1.jpg",
    ...overrides,
  };
}

function daejeonPlace(overrides: Record<string, unknown> = {}) {
  return {
    id: "culture-1",
    name: "대전시립미술관",
    category: "문화",
    district: "서구",
    lat: 36.36,
    lng: 127.38,
    imageUrl: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sources.petTourSpots.mockResolvedValue([]);
  sources.petFacilities.mockResolvedValue([]);
  sources.verifiedRestaurants.mockResolvedValue([]);
  sources.parks.mockResolvedValue([]);
  sources.culture.mockResolvedValue([]);
  sources.lodgings.mockResolvedValue([]);
  sources.tourspots.mockResolvedValue([]);
  sources.exemplaryRestaurants.mockResolvedValue([]);
  sources.shopping.mockResolvedValue([]);
  sources.campgrounds.mockResolvedValue([]);
  sources.petAcp = [];
  sources.dogParks = [];
  // 기본은 카카오 키 없음 — 이미지 보강을 끄고 정규화 규칙만 본다.
  sources.assertKakaoRestKey.mockImplementation(() => {
    throw new Error("KAKAO_REST_API_KEY 없음");
  });
});

describe("소스 실패 허용", () => {
  it("소스 하나가 터져도 나머지는 그대로 돌려준다", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    sources.petTourSpots.mockRejectedValue(new Error("공공데이터 타임아웃"));
    sources.campgrounds.mockResolvedValue([
      { id: "camp-1", name: "대청호캠핑장", district: "동구", lat: 36.4, lng: 127.4, imageUrl: null },
    ]);

    const places = await fetchAggregatedPlaces();

    expect(places.map((place) => place.name)).toEqual(["대청호캠핑장"]);
  });

  it("전부 실패해도 빈 배열로 끝난다 — 목록 화면이 500을 받지 않게", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    sources.petTourSpots.mockRejectedValue(new Error("실패"));
    sources.parks.mockRejectedValue(new Error("실패"));

    expect(await fetchAggregatedPlaces()).toEqual([]);
  });
});

describe("관광타입 → 카테고리 매핑", () => {
  it.each([
    ["12(관광지)", "12", "산책"],
    ["14(문화시설)", "14", "문화"],
    ["15(축제)", "15", "문화"],
    ["28(레포츠)", "28", "산책"],
    ["38(쇼핑)", "38", "문화"],
    ["39(음식점)", "39", "맛집"],
  ])("%s는 %s로 묶는다", async (_label, contentTypeId, expected) => {
    sources.petTourSpots.mockResolvedValue([petTourSpot({ contentTypeId })]);

    const [place] = await fetchAggregatedPlaces();

    expect(place.category).toBe(expected);
  });

  it("32(숙박)는 아예 버린다 — 모텔이 문화형 코스 추천에 섞이던 원인이다", async () => {
    sources.petTourSpots.mockResolvedValue([petTourSpot({ contentTypeId: "32" })]);

    expect(await fetchAggregatedPlaces()).toEqual([]);
  });
});

describe("지역·좌표 거르기", () => {
  it("주소에서 자치구를 뽑아 채운다", async () => {
    sources.petTourSpots.mockResolvedValue([petTourSpot()]);

    expect((await fetchAggregatedPlaces())[0].district).toBe("서구");
  });

  it("대전 5개 자치구 밖은 넣지 않는다", async () => {
    sources.petTourSpots.mockResolvedValue([
      petTourSpot({ address: "세종특별자치시 한누리대로 2130" }),
    ]);

    expect(await fetchAggregatedPlaces()).toEqual([]);
  });

  it("지도에 못 찍는 좌표는 버린다", async () => {
    sources.petTourSpots.mockResolvedValue([
      petTourSpot({ id: "1", lat: Number.NaN }),
      petTourSpot({ id: "2", name: "유성온천", lng: Number.POSITIVE_INFINITY }),
    ]);

    expect(await fetchAggregatedPlaces()).toEqual([]);
  });

  it("대전시 공공데이터도 5개 구만 남긴다", async () => {
    sources.culture.mockResolvedValue([
      daejeonPlace(),
      daejeonPlace({ id: "culture-2", name: "청주시립미술관", district: "청주시" }),
    ]);

    expect((await fetchAggregatedPlaces()).map((place) => place.name)).toEqual(["대전시립미술관"]);
  });

  it("프론트에 없는 카테고리는 버린다", async () => {
    sources.culture.mockResolvedValue([daejeonPlace({ category: "숙박" })]);

    expect(await fetchAggregatedPlaces()).toEqual([]);
  });
});

describe("이름 기준 dedupe", () => {
  it("공백 차이만 있는 같은 이름은 하나로 합친다", async () => {
    sources.petTourSpots.mockResolvedValue([petTourSpot({ name: "한밭 수목원" })]);
    sources.campgrounds.mockResolvedValue([
      { id: "camp-1", name: "한밭수목원", district: "서구", lat: 36.36, lng: 127.38, imageUrl: null },
    ]);

    expect(await fetchAggregatedPlaces()).toHaveLength(1);
  });

  it("신뢰도 티어가 높은 소스를 남긴다 — 인증 정보가 추정치에 밀리면 안 된다", async () => {
    // 공원(tier 2)과 반려동물 동반여행지 인증(tier 1)이 같은 이름으로 겹치는 경우.
    sources.petTourSpots.mockResolvedValue([petTourSpot({ name: "보라매공원 근린공원" })]);
    sources.parks.mockResolvedValue([
      {
        id: "p1",
        name: "보라매공원",
        section: "근린공원",
        address: "대전광역시 서구",
        lat: 36.35,
        lng: 127.37,
        imageUrl: null,
      },
    ]);

    const [place] = await fetchAggregatedPlaces();

    expect(place.source).toBe("pettour");
    expect(place.sourceTier).toBe(1);
  });

  it("티어가 같으면 사진이 있는 쪽을 남긴다", async () => {
    sources.petTourSpots.mockResolvedValue([petTourSpot({ name: "같은곳", imageUrl: null })]);
    sources.campgrounds.mockResolvedValue([
      {
        id: "camp-1",
        name: "같은곳",
        district: "서구",
        lat: 36.36,
        lng: 127.38,
        imageUrl: "https://img/camp.jpg",
      },
    ]);

    expect((await fetchAggregatedPlaces())[0].imageUrl).toBe("https://img/camp.jpg");
  });
});

describe("이미지 보강", () => {
  it("카카오 키가 없으면 보강을 건너뛰고 그대로 돌려준다", async () => {
    sources.culture.mockResolvedValue([daejeonPlace({ imageUrl: null })]);

    const [place] = await fetchAggregatedPlaces();

    expect(place.imageUrl).toBeNull();
    expect(sources.fetchPlaceImage).not.toHaveBeenCalled();
  });

  it("사진이 없는 곳만 검색해 채운다", async () => {
    sources.assertKakaoRestKey.mockReturnValue("kakao-key");
    sources.fetchPlaceImage.mockResolvedValue("https://img/found.jpg");
    sources.culture.mockResolvedValue([
      daejeonPlace({ id: "culture-1", name: "사진없음", imageUrl: null }),
      daejeonPlace({ id: "culture-2", name: "사진있음", imageUrl: "https://img/have.jpg" }),
    ]);

    const places = await fetchAggregatedPlaces();

    expect(sources.fetchPlaceImage).toHaveBeenCalledTimes(1);
    expect(sources.fetchPlaceImage.mock.calls[0][0]).toContain("사진없음");
    expect(places.find((place) => "사진없음" === place.name)?.imageUrl).toBe(
      "https://img/found.jpg"
    );
    expect(places.find((place) => "사진있음" === place.name)?.imageUrl).toBe("https://img/have.jpg");
  });

  it("이미지 검색이 실패해도 목록 전체를 버리지 않는다", async () => {
    sources.assertKakaoRestKey.mockReturnValue("kakao-key");
    sources.fetchPlaceImage.mockRejectedValue(new Error("레이트리밋"));
    sources.culture.mockResolvedValue([daejeonPlace({ imageUrl: null })]);

    const [place] = await fetchAggregatedPlaces();

    expect(place.name).toBe("대전시립미술관");
    expect(place.imageUrl).toBeNull();
  });
});

describe("동반 조건", () => {
  it("문체부 조사에서 동반 불가로 확인된 곳은 그대로 표시한다", async () => {
    sources.petAcp = [
      {
        name: "출입금지시설",
        category: "문화",
        district: "서구",
        lat: 36.36,
        lng: 127.38,
        petPossible: "N",
        petSize: "해당없음",
        petLimit: "해당없음",
      },
    ];

    const [place] = await fetchAggregatedPlaces();

    expect(place.petFriendly).toBe(false);
    expect(place.condition).toContain("동반 불가");
  });

  it("견종 제한이 있으면 smallDogOnly로 구분한다 — 단일 불리언으로 뭉뚱그리지 않는다", async () => {
    sources.petAcp = [
      {
        name: "소형견카페",
        category: "맛집",
        district: "중구",
        lat: 36.32,
        lng: 127.42,
        petPossible: "Y",
        petSize: "10kg 미만",
        petLimit: "케이지 필수",
      },
    ];

    const [place] = await fetchAggregatedPlaces();

    expect(place).toMatchObject({ petFriendly: true, smallDogOnly: true });
    expect(place.condition).toContain("10kg 미만");
    expect(place.condition).toContain("케이지 필수");
  });

  it("모든 견종이 가능하면 smallDogOnly가 아니다", async () => {
    sources.petAcp = [
      {
        name: "전견종카페",
        category: "맛집",
        district: "중구",
        lat: 36.32,
        lng: 127.42,
        petPossible: "Y",
        petSize: "모두 가능",
        petLimit: "해당없음",
      },
    ];

    const [place] = await fetchAggregatedPlaces();

    expect(place.smallDogOnly).toBe(false);
    expect(place.condition).toContain("전 견종 동반 가능");
  });

  it("자치구 반려동물 놀이터는 놀이터로 묶는다", async () => {
    sources.dogParks = [
      { name: "유성 반려동물놀이터", district: "유성구", lat: 36.36, lng: 127.35, note: "연중무휴" },
    ];

    const [place] = await fetchAggregatedPlaces();

    expect(place.category).toBe("놀이터");
    expect(place.condition).toContain("연중무휴");
  });
});
