import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 응답 스키마를 상상해 고정하지 않는다 — petTourSpots.ts가 타입(PetTourRawItem)으로 못박아 둔
 * 모양을 쓰고, "그 모양이 들어오면 무엇으로 바꾸고 어떻게 합치는가"만 본다.
 */
const fetchMock = vi.fn();

/** 캐시가 모듈 전역 Map이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadPetTour() {
  vi.resetModules();
  return import("./petTourSpots");
}

function spot(overrides: Record<string, string> = {}) {
  return {
    contentid: "1001",
    contenttypeid: "12",
    title: "한밭수목원",
    addr1: "대전광역시 서구 둔산대로 169",
    addr2: "동원",
    mapx: "127.3886",
    mapy: "36.3669",
    firstimage: "https://img/spot.jpg",
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

/** 목록 요청에는 items를, 이미지 요청에는 빈 결과를 돌려준다. */
function giveSpots(items: unknown[], images: unknown[] = []) {
  fetchMock.mockImplementation(async (url: string) =>
    String(url).includes("detailImage2") ? jsonOf(envelope(images)) : jsonOf(envelope(items))
  );
}

/** 목록 조회에 실린 관광타입들. */
function requestedTypes(): string[] {
  return fetchMock.mock.calls
    .map(([url]) => new URL(String(url)).searchParams.get("contentTypeId"))
    .filter((typeId): typeId is string => typeId !== null);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  giveSpots([spot()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("열쇠가 없을 때", () => {
  it("어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await expect(fetchDaejeonPetTourSpots()).rejects.toThrow(/backend\/.env/);
  });
});

describe("관광지 정보로 바꾸기", () => {
  it("응답 항목을 화면이 쓰는 모양으로 옮긴다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first).toEqual({
      id: "1001",
      contentTypeId: "12",
      name: "한밭수목원",
      address: "대전광역시 서구 둔산대로 169 동원",
      lat: 36.3669,
      lng: 127.3886,
      imageUrl: "https://img/spot.jpg",
      tel: "042-000-0000",
    });
  });

  it("mapx가 경도, mapy가 위도다 — 이름만 보면 뒤집기 쉽다", async () => {
    giveSpots([spot({ mapx: "127.1", mapy: "36.9" })]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first).toMatchObject({ lat: 36.9, lng: 127.1 });
  });

  it("상세주소가 없으면 꼬리 공백을 남기지 않는다", async () => {
    giveSpots([spot({ addr2: "" })]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first.address).toBe("대전광역시 서구 둔산대로 169");
  });

  it("사진·전화가 빈 문자열이면 null로 둔다", async () => {
    giveSpots([spot({ firstimage: "", tel: "" })]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first).toMatchObject({ imageUrl: null, tel: null });
  });
});

describe("관광타입별로 나눠 조회하기", () => {
  it("타입을 안 주면 타입마다 따로 물어본다 — 한 번에 묶으면 한 타입에 결과가 쏠린다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots();

    expect(requestedTypes().sort()).toEqual(["12", "14", "15", "28", "38", "39"]);
  });

  it("숙박(32)은 아예 묻지 않는다 — 모텔·호텔이 문화형 코스에 섞이던 문제", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots();

    expect(requestedTypes()).not.toContain("32");
  });

  it("타입을 지정하면 그 타입만 묻는다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "39" });

    expect(requestedTypes()).toEqual(["39"]);
  });

  it("같은 장소가 여러 타입에 걸려 와도 한 번만 남긴다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const spots = await fetchDaejeonPetTourSpots();

    expect(spots).toHaveLength(1);
  });

  it("한 타입이 실패해도 나머지 타입 결과는 살린다", async () => {
    let calls = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("detailImage2")) return jsonOf(envelope([]));
      calls += 1;
      if (calls === 1) return new Response("", { status: 500, statusText: "Server Error" });
      return jsonOf(envelope([spot({ contentid: `spot-${calls}` })]));
    });
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const spots = await fetchDaejeonPetTourSpots();

    expect(spots.length).toBeGreaterThan(0);
  });

  it("구를 지정하면 조회 조건에 실어 보낸다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12", sigunguCode: "1" });

    expect(String(fetchMock.mock.calls[0][0])).toContain("sigunguCode=1");
  });

  it("대전 지역코드로만 물어본다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(String(fetchMock.mock.calls[0][0])).toContain("areaCode=3");
  });
});

describe("빠진 사진 채우기", () => {
  it("사진이 없는 곳만 따로 물어 채운다", async () => {
    giveSpots([spot({ contentid: "1", firstimage: "" })], [{ smallimageurl: "https://img/small.jpg" }]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first.imageUrl).toBe("https://img/small.jpg");
  });

  it("사진이 이미 있으면 더 묻지 않는다 — 일일 한도가 1,000회뿐이다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("detailImage2"))).toHaveLength(0);
  });

  it("작은 사진이 없으면 원본 사진을 쓴다", async () => {
    giveSpots([spot({ firstimage: "" })], [{ originimgurl: "https://img/origin.jpg" }]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first.imageUrl).toBe("https://img/origin.jpg");
  });

  it("사진 조회가 터져도 장소 목록은 그대로 돌려준다 — 이모지 카드로 남으면 된다", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("detailImage2")
        ? new Response("", { status: 500, statusText: "Server Error" })
        : jsonOf(envelope([spot({ firstimage: "" })]))
    );
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    const [first] = await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(first).toMatchObject({ name: "한밭수목원", imageUrl: null });
  });

  it("한 번에 채우는 장수에 상한을 둔다", async () => {
    const many = Array.from({ length: 80 }, (_, i) => spot({ contentid: `c${i}`, firstimage: "" }));
    giveSpots(many, [{ smallimageurl: "https://img/small.jpg" }]);
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12", numOfRows: 80 });

    const imageCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("detailImage2"));
    expect(imageCalls).toHaveLength(60);
  });
});

describe("캐시", () => {
  it("같은 조건은 한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12" });
    await fetchDaejeonPetTourSpots({ contentTypeId: "12" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("조건이 다르면 따로 물어본다", async () => {
    const { fetchDaejeonPetTourSpots } = await loadPetTour();

    await fetchDaejeonPetTourSpots({ contentTypeId: "12" });
    await fetchDaejeonPetTourSpots({ contentTypeId: "14" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
