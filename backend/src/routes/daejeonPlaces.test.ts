import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./daejeonPlaces";

const lib = vi.hoisted(() => ({
  fetchDaejeonCultureFacilities: vi.fn(),
  fetchDaejeonLodgings: vi.fn(),
  fetchDaejeonTourspots: vi.fn(),
  fetchDaejeonExemplaryRestaurants: vi.fn(),
}));
vi.mock("../lib/daejeonPlaces", () => lib);

const app = createTestApp("/api/daejeon-places", router);

const TYPES = {
  culture: lib.fetchDaejeonCultureFacilities,
  lodging: lib.fetchDaejeonLodgings,
  tourspot: lib.fetchDaejeonTourspots,
  restaurant: lib.fetchDaejeonExemplaryRestaurants,
};

beforeEach(() => {
  for (const fetcher of Object.values(TYPES)) {
    fetcher.mockReset();
    fetcher.mockResolvedValue([]);
  }
});

describe("GET /api/daejeon-places/:type", () => {
  it("타입마다 제 조회를 부른다 — 섞이면 엉뚱한 목록이 나간다", async () => {
    for (const [type, fetcher] of Object.entries(TYPES)) {
      const response = await request(app).get(`/api/daejeon-places/${type}`);

      expect(response.status, type).toBe(200);
      expect(fetcher, type).toHaveBeenCalledTimes(1);
    }
  });

  it("목록을 places 키에 담아 돌려준다", async () => {
    lib.fetchDaejeonCultureFacilities.mockResolvedValue([{ id: "culture-0", name: "예술의전당" }]);

    const response = await request(app).get("/api/daejeon-places/culture");

    expect(response.body).toEqual({ places: [{ id: "culture-0", name: "예술의전당" }] });
  });

  it("모르는 타입은 400으로 막고 고를 수 있는 값을 알려준다", async () => {
    const response = await request(app).get("/api/daejeon-places/없는것");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("culture");
    expect(lib.fetchDaejeonCultureFacilities).not.toHaveBeenCalled();
  });

  it("공공데이터가 실패하면 502로 사유를 실어 보낸다", async () => {
    lib.fetchDaejeonLodgings.mockRejectedValue(new Error("공공데이터포털 요청 실패: 503"));

    const response = await request(app).get("/api/daejeon-places/lodging");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("공공데이터포털 요청 실패: 503");
  });

  it("사유를 알 수 없는 실패에도 빈 응답을 남기지 않는다", async () => {
    lib.fetchDaejeonTourspots.mockRejectedValue("문자열로 던짐");

    const response = await request(app).get("/api/daejeon-places/tourspot");

    expect(response.body.error).toBe("대전시 데이터를 불러오지 못했어요");
  });
});
