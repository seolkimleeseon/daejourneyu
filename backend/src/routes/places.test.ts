import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";

/*
 * 여러 공공데이터를 합친 목록을 걸러 보내는 라우트다. 합치는 쪽은 placesAggregator 테스트가
 * 따로 보므로, 여기서는 거르기·정렬·캐시 공유만 본다.
 */
const aggregator = vi.hoisted(() => ({ fetchAggregatedPlaces: vi.fn() }));
vi.mock("../lib/placesAggregator", () => ({ fetchAggregatedPlaces: aggregator.fetchAggregatedPlaces }));
const bakery = vi.hoisted(() => ({ fetchBakeryCandidates: vi.fn() }));
vi.mock("../lib/bakeries", () => ({ fetchBakeryCandidates: bakery.fetchBakeryCandidates }));

/**
 * 이 라우트는 합친 목록을 모듈 전역 Map에 5분간 담아 여러 요청이 나눠 쓰게 한다 — 테스트끼리
 * 결과가 새어 나가지 않도록 케이스마다 라우터를 새로 불러 앱을 다시 세운다.
 */
async function makeApp() {
  vi.resetModules();
  const { default: router } = await import("./places");
  return createTestApp("/api/places", router);
}

function place(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "한밭수목원",
    category: "산책",
    district: "서구",
    condition: "전 견종",
    petFriendly: true,
    lat: 36.36,
    lng: 127.38,
    imageUrl: null,
    source: "park",
    sourceTier: 2,
    ...overrides,
  };
}

beforeEach(() => {
  aggregator.fetchAggregatedPlaces.mockReset();
  aggregator.fetchAggregatedPlaces.mockResolvedValue([]);
  bakery.fetchBakeryCandidates.mockReset();
  bakery.fetchBakeryCandidates.mockResolvedValue([]);
});

it("빵집 후보의 지역과 재탐색 묶음을 전달하고 범위 밖 묶음은 제한한다", async () => {
  const app = await makeApp();
  await request(app).get("/api/places/bakeries?district=서구&batch=2");
  expect(bakery.fetchBakeryCandidates).toHaveBeenLastCalledWith("서구", 2);
  await request(app).get("/api/places/bakeries?batch=99");
  expect(bakery.fetchBakeryCandidates).toHaveBeenLastCalledWith(undefined, 0);
});

describe("GET /api/places", () => {
  it("목록을 배열 그대로 돌려준다 — 이 라우트만 껍데기를 씌우지 않는다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([place()]);

    const response = await request(await makeApp()).get("/api/places");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toMatchObject({ id: "p1", name: "한밭수목원" });
  });

  it("구로 거른다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([
      place({ id: "a", district: "서구" }),
      place({ id: "b", district: "유성구" }),
    ]);

    const response = await request(await makeApp()).get("/api/places?district=유성구");

    expect(response.body.map((p: { id: string }) => p.id)).toEqual(["b"]);
  });

  it("카테고리와 출처로도 거르고, 여러 조건은 함께 건다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([
      place({ id: "a", category: "산책", source: "park" }),
      place({ id: "b", category: "맛집", source: "petacp" }),
      place({ id: "c", category: "맛집", source: "park" }),
    ]);

    const byCategory = await request(await makeApp()).get("/api/places?category=맛집");
    expect(byCategory.body.map((p: { id: string }) => p.id).sort()).toEqual(["b", "c"]);

    const bySource = await request(await makeApp()).get("/api/places?category=맛집&source=petacp");
    expect(bySource.body.map((p: { id: string }) => p.id)).toEqual(["b"]);
  });

  it("인증 소스를 앞세우고 같은 등급 안에서는 가나다로 세운다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([
      place({ id: "a", name: "하늘공원", sourceTier: 2 }),
      place({ id: "b", name: "나무공원", sourceTier: 2 }),
      place({ id: "c", name: "하얀카페", sourceTier: 1 }),
    ]);

    const response = await request(await makeApp()).get("/api/places");

    expect(response.body.map((p: { id: string }) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("조건에 맞는 게 없으면 빈 배열이다 — 404가 아니다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([place()]);

    const response = await request(await makeApp()).get("/api/places?district=대덕구");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("여러 요청이 같은 조회를 나눠 쓴다 — 공공데이터 일일 한도를 아낀다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([place()]);

    const app = await makeApp();
    await request(app).get("/api/places");
    await request(app).get("/api/places?district=서구");

    expect(aggregator.fetchAggregatedPlaces).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/places/:id", () => {
  it("id로 한 곳을 찾아 돌려준다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([place({ id: "park-1" })]);

    const response = await request(await makeApp()).get("/api/places/park-1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "park-1" });
  });

  it("없는 id는 404다", async () => {
    aggregator.fetchAggregatedPlaces.mockResolvedValue([place({ id: "park-1" })]);

    const response = await request(await makeApp()).get("/api/places/없는id");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "not found" });
  });
});
