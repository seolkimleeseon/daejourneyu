import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./kakaoPlaces";

const lib = vi.hoisted(() => ({ searchKakaoPlaces: vi.fn() }));
vi.mock("../lib/kakaoLocal", () => ({ searchKakaoPlaces: lib.searchKakaoPlaces }));

const app = createTestApp("/api/kakao-places", router);

beforeEach(() => {
  lib.searchKakaoPlaces.mockReset();
  lib.searchKakaoPlaces.mockResolvedValue([]);
});

describe("GET /api/kakao-places", () => {
  it("검색 결과를 places 키에 담아 돌려준다", async () => {
    lib.searchKakaoPlaces.mockResolvedValue([{ id: "1", name: "댕댕카페" }]);

    const response = await request(app).get("/api/kakao-places?query=대전 카페");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ places: [{ id: "1", name: "댕댕카페" }] });
  });

  it("검색어를 그대로 넘긴다", async () => {
    await request(app).get("/api/kakao-places?query=대전 유성구 카페");

    expect(lib.searchKakaoPlaces).toHaveBeenCalledWith("대전 유성구 카페", undefined);
  });

  it("개수를 숫자로 바꿔 넘긴다 — 쿼리는 늘 문자열로 들어온다", async () => {
    await request(app).get("/api/kakao-places?query=카페&size=10");

    expect(lib.searchKakaoPlaces).toHaveBeenCalledWith("카페", 10);
  });

  it("검색어가 없으면 400으로 막는다 — 빈 검색으로 카카오를 부르지 않는다", async () => {
    const response = await request(app).get("/api/kakao-places");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("query");
    expect(lib.searchKakaoPlaces).not.toHaveBeenCalled();
  });

  it("카카오가 막히면 502로 사유를 실어 보낸다", async () => {
    lib.searchKakaoPlaces.mockRejectedValue(new Error("카카오 로컬 요청 실패: 429"));

    const response = await request(app).get("/api/kakao-places?query=카페");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("카카오 로컬 요청 실패: 429");
  });
});
