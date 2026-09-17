import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stableId } from "./stableId";

/*
 * 응답 스키마를 상상해 고정하지 않는다 — campgrounds.ts가 타입(RawCampgroundItem)으로 못박아 둔
 * 모양을 쓰고, "그 모양이 들어오면 무엇을 남기고 무엇을 버리는가"만 본다.
 */
const fetchMock = vi.fn();

/** 캐시가 모듈 전역 Map(TTL 24시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadCampgrounds() {
  vi.resetModules();
  return import("./campgrounds");
}

function camp(overrides: Record<string, string> = {}) {
  return {
    facltNm: "대청호 오토캠핑장",
    sigunguNm: "동구",
    addr1: "대전광역시 동구 대청호수로 1",
    mapX: "127.4800",
    mapY: "36.4800",
    intro: "호수 옆 캠핑장",
    animalCmgCl: "가능",
    firstImageUrl: "https://img/camp.jpg",
    ...overrides,
  };
}

function giveCamps(items: unknown[]) {
  fetchMock.mockImplementation(async () => (
    new Response(JSON.stringify({ response: { body: { items: { item: items } } } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  ));
}

/** 남은 캠핑장 이름만 뽑는다. */
async function names(items: unknown[]): Promise<string[]> {
  giveCamps(items);
  const { fetchDaejeonCampgrounds } = await loadCampgrounds();
  return (await fetchDaejeonCampgrounds()).map((c) => c.name);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  giveCamps([camp()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("열쇠가 없을 때", () => {
  it("어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await expect(fetchDaejeonCampgrounds()).rejects.toThrow(/backend\/.env/);
  });
});

describe("캠핑장 정보로 바꾸기", () => {
  it("응답 항목을 화면이 쓰는 모양으로 옮긴다", async () => {
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await expect(fetchDaejeonCampgrounds()).resolves.toEqual([
      {
        id: stableId("camp", "대청호 오토캠핑장", "대전광역시 동구 대청호수로 1"),
        name: "대청호 오토캠핑장",
        district: "동구",
        address: "대전광역시 동구 대청호수로 1",
        lat: 36.48,
        lng: 127.48,
        imageUrl: "https://img/camp.jpg",
      },
    ]);
  });

  it("mapX가 경도, mapY가 위도다 — 이름만 보면 뒤집기 쉽다", async () => {
    giveCamps([camp({ mapX: "127.1", mapY: "36.9" })]);
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    const [first] = await fetchDaejeonCampgrounds();

    expect(first).toMatchObject({ lat: 36.9, lng: 127.1 });
  });

  it("사진이 없으면 빈 문자열 대신 null로 둔다", async () => {
    giveCamps([camp({ firstImageUrl: "" })]);
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    const [first] = await fetchDaejeonCampgrounds();

    expect(first.imageUrl).toBeNull();
  });

  it("본문이 비어 있어도 빈 목록으로 돌려준다 — 던지지 않는다", async () => {
    fetchMock.mockImplementation(async () => new Response("{}", { status: 200 }));
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await expect(fetchDaejeonCampgrounds()).resolves.toEqual([]);
  });
});

describe("대전 밖 걸러내기", () => {
  it("반경 20km 안이어도 대전 5개 구가 아니면 뺀다 — 세종·공주가 딸려 온다", async () => {
    expect(
      await names([
        camp({ facltNm: "대전캠핑장", sigunguNm: "유성구" }),
        camp({ facltNm: "세종캠핑장", sigunguNm: "세종시" }),
        camp({ facltNm: "공주캠핑장", sigunguNm: "공주시" }),
      ])
    ).toEqual(["대전캠핑장"]);
  });

  it("대전 5개 구는 모두 남긴다", async () => {
    expect(
      await names(
        ["유성구", "중구", "동구", "대덕구", "서구"].map((gu) => camp({ facltNm: gu, sigunguNm: gu }))
      )
    ).toHaveLength(5);
  });
});

describe("동반 가능 여부로 걸러내기", () => {
  it("동반 가능한 곳은 남긴다", async () => {
    expect(await names([camp({ facltNm: "가능캠핑장", animalCmgCl: "가능" })])).toEqual(["가능캠핑장"]);
  });

  it("소형견 조건부도 남긴다 — 조건이 붙었을 뿐 동반은 된다", async () => {
    expect(await names([camp({ facltNm: "소형견캠핑장", animalCmgCl: "가능(소형견)" })])).toEqual([
      "소형견캠핑장",
    ]);
  });

  it("동반 정보가 없으면 뺀다 — 모르는 곳을 가능한 것처럼 보여주지 않는다", async () => {
    expect(await names([camp({ facltNm: "정보없음캠핑장", animalCmgCl: "" })])).toEqual([]);
  });

  it("동반 불가인 곳은 뺀다 — '불가능'이 '가능'을 부분 문자열로 품고 있어 새던 자리다", async () => {
    expect(await names([camp({ facltNm: "출입금지캠핑장", animalCmgCl: "불가능" })])).toEqual([]);
  });

  it("가능과 불가능이 섞여 와도 가능한 곳만 남긴다", async () => {
    expect(
      await names([
        camp({ facltNm: "가능캠핑장", animalCmgCl: "가능" }),
        camp({ facltNm: "출입금지캠핑장", animalCmgCl: "불가능" }),
        camp({ facltNm: "소형견캠핑장", animalCmgCl: "가능(소형견)" }),
      ])
    ).toEqual(["가능캠핑장", "소형견캠핑장"]);
  });
});

describe("좌표", () => {
  it("좌표가 없으면 뺀다 — 지도에 못 꽂는 캠핑장이다", async () => {
    expect(
      await names([
        camp({ facltNm: "좌표없음", mapX: "", mapY: "" }),
        camp({ facltNm: "좌표있음" }),
      ])
    ).toEqual(["좌표있음"]);
  });

  it("좌표가 숫자가 아니어도 뺀다", async () => {
    expect(await names([camp({ facltNm: "글자좌표", mapX: "정보없음", mapY: "정보없음" })])).toEqual([]);
  });
});

describe("요청과 실패", () => {
  it("대전시청 좌표에서 반경 20km로 물어본다 — 전국구 API다", async () => {
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await fetchDaejeonCampgrounds();

    const url = String(fetchMock.mock.lastCall?.[0]);
    expect(url).toContain("mapX=127.3845");
    expect(url).toContain("mapY=36.3504");
    expect(url).toContain("radius=20000");
    expect(url).toContain("_type=json");
  });

  it("한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await fetchDaejeonCampgrounds();
    await fetchDaejeonCampgrounds();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("응답이 실패면 상태 코드까지 담아 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" }));
    const { fetchDaejeonCampgrounds } = await loadCampgrounds();

    await expect(fetchDaejeonCampgrounds()).rejects.toThrow(/500/);
  });
});
