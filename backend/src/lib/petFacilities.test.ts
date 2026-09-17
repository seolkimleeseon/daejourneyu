import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stableId } from "./stableId";

/*
 * 원본엔 좌표가 없어 주소를 카카오 지오코딩으로 태우는 소스다 — 지오코딩과 사진 보충은
 * kakaoLocal 쪽 테스트가 따로 보므로, 여기서는 "무엇을 남기고 어떤 검색어로 넘기는가"만 본다.
 */
const fetchMock = vi.fn();

const kakao = vi.hoisted(() => ({ geocodeAddress: vi.fn(), supplementImagesByName: vi.fn() }));
vi.mock("./kakaoLocal", () => ({
  geocodeAddress: kakao.geocodeAddress,
  supplementImagesByName: kakao.supplementImagesByName,
}));

/** 캐시가 모듈 전역 Map(TTL 24시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadPetFacilities() {
  vi.resetModules();
  return import("./petFacilities");
}

function facility(overrides: Record<string, string> = {}) {
  return {
    지역: "유성구",
    사업유형: "동반카페",
    업체명: "댕댕카페",
    주소: "온천북로 1",
    ...overrides,
  };
}

function giveFacilities(items: unknown[]) {
  fetchMock.mockImplementation(async () => (
    new Response(JSON.stringify({ data: items, totalCount: items.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  ));
}

beforeEach(() => {
  fetchMock.mockReset();
  kakao.geocodeAddress.mockReset();
  kakao.supplementImagesByName.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  kakao.geocodeAddress.mockResolvedValue({ lat: 36.36, lng: 127.38 });
  kakao.supplementImagesByName.mockImplementation(async (list: unknown[]) => list);
  giveFacilities([facility()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("열쇠가 없을 때", () => {
  it("어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await expect(fetchDaejeonPetFacilities()).rejects.toThrow(/backend\/.env/);
  });
});

describe("시설 정보로 바꾸기", () => {
  it("응답 항목을 화면이 쓰는 모양으로 옮긴다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await expect(fetchDaejeonPetFacilities()).resolves.toEqual([
      {
        id: stableId("petfac", "댕댕카페", "온천북로 1"),
        name: "댕댕카페",
        category: "맛집",
        district: "유성구",
        address: "온천북로 1",
        lat: 36.36,
        lng: 127.38,
        imageUrl: null,
      },
    ]);
  });

  it("본문이 비어 있어도 빈 목록으로 돌려준다", async () => {
    giveFacilities([]);
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await expect(fetchDaejeonPetFacilities()).resolves.toEqual([]);
  });
});

describe("사업유형 → 카테고리", () => {
  async function categoryOf(businessType: string): Promise<string | undefined> {
    giveFacilities([facility({ 사업유형: businessType })]);
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();
    const [first] = await fetchDaejeonPetFacilities();
    return first?.category;
  }

  it("카페·음식점은 맛집으로 묶는다", async () => {
    expect(await categoryOf("동반카페")).toBe("맛집");
    expect(await categoryOf("전문 카페")).toBe("맛집");
    expect(await categoryOf("동반음식점")).toBe("맛집");
  });

  it("공원은 산책, 여가 인프라는 놀이터, 숙박시설은 숙박", async () => {
    expect(await categoryOf("동반공원(광장)")).toBe("산책");
    expect(await categoryOf("여가 인프라(산책길, 편의시설, 놀이터)")).toBe("놀이터");
    expect(await categoryOf("숙박시설")).toBe("숙박");
  });

  it("전문업체·인력은 아예 뺀다 — 미용실·촬영은 여행지가 아니다", async () => {
    expect(await categoryOf("전문업체/인력")).toBeUndefined();
  });

  it("처음 보는 유형도 뺀다 — 카테고리를 억지로 짐작하지 않는다", async () => {
    expect(await categoryOf("새로 생긴 유형")).toBeUndefined();
  });

  it("뺄 항목은 지오코딩도 시키지 않는다 — 버릴 주소로 카카오를 부를 이유가 없다", async () => {
    giveFacilities([facility({ 사업유형: "전문업체/인력" })]);
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();

    expect(kakao.geocodeAddress).not.toHaveBeenCalled();
  });
});

describe("좌표 채우기", () => {
  it("지역과 주소를 이어 대전 주소로 물어본다 — 원본 주소엔 시·구가 빠져 있다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();

    expect(kakao.geocodeAddress).toHaveBeenCalledWith("대전 유성구 온천북로 1");
  });

  it("좌표를 못 찾은 곳은 뺀다 — 지도에 못 꽂는다", async () => {
    giveFacilities([facility({ 업체명: "주소불명" }), facility({ 업체명: "정상" })]);
    kakao.geocodeAddress.mockResolvedValueOnce(null);
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    const facilities = await fetchDaejeonPetFacilities();

    expect(facilities.map((f) => f.name)).toEqual(["정상"]);
  });

  it("지오코딩이 터져도 그 한 곳만 빠지고 나머지는 살린다", async () => {
    giveFacilities([facility({ 업체명: "실패" }), facility({ 업체명: "정상" })]);
    kakao.geocodeAddress.mockRejectedValueOnce(new Error("카카오 응답 없음"));
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    const facilities = await fetchDaejeonPetFacilities();

    expect(facilities.map((f) => f.name)).toEqual(["정상"]);
  });
});

describe("사진 보충", () => {
  it("이름에 카테고리 힌트를 붙여 검색한다 — 이름+구만으론 무관한 사진이 잡힌다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();

    const [, buildQuery] = kakao.supplementImagesByName.mock.lastCall as [
      unknown[],
      (f: { district: string; name: string; category: string }) => string,
      number,
    ];
    expect(buildQuery({ district: "유성구", name: "댕댕카페", category: "맛집" })).toBe(
      "대전 유성구 댕댕카페 맛집"
    );
    expect(buildQuery({ district: "서구", name: "한밭수목원", category: "산책" })).toBe(
      "대전 서구 한밭수목원 공원"
    );
  });

  it("한 번에 채우는 장수에 상한을 둔다 — 카카오 호출이 그만큼 늘어난다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();

    expect(kakao.supplementImagesByName.mock.lastCall?.[2]).toBe(80);
  });
});

describe("요청과 실패", () => {
  it("한 번에 200건까지 받아 온다 — 원본이 186건이다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();

    expect(String(fetchMock.mock.lastCall?.[0])).toContain("perPage=200");
  });

  it("한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await fetchDaejeonPetFacilities();
    await fetchDaejeonPetFacilities();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("응답이 실패면 상태 코드까지 담아 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 429, statusText: "Too Many Requests" }));
    const { fetchDaejeonPetFacilities } = await loadPetFacilities();

    await expect(fetchDaejeonPetFacilities()).rejects.toThrow(/429/);
  });
});
