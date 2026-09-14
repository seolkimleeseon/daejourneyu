import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./weather";

const lib = vi.hoisted(() => ({ fetchDaejeonForecast: vi.fn() }));
vi.mock("../lib/weather", () => ({ fetchDaejeonForecast: lib.fetchDaejeonForecast }));

const app = createTestApp("/api/weather", router);

beforeEach(() => {
  lib.fetchDaejeonForecast.mockReset();
  lib.fetchDaejeonForecast.mockResolvedValue({ district: "대전시청", forecast: [] });
});

describe("GET /api/weather", () => {
  it("지점 이름과 예보를 함께 돌려준다 — 화면이 '📍 어디' 로 같이 보여준다", async () => {
    lib.fetchDaejeonForecast.mockResolvedValue({
      district: "유성구",
      forecast: [{ date: "2026-09-14", time: "15:00", temperatureC: 18 }],
    });

    const response = await request(app).get("/api/weather");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      district: "유성구",
      forecast: [{ date: "2026-09-14", time: "15:00", temperatureC: 18 }],
    });
  });

  it("좌표를 숫자로 바꿔 넘긴다 — 쿼리는 늘 문자열로 들어온다", async () => {
    await request(app).get("/api/weather?lat=36.36&lng=127.38");

    expect(lib.fetchDaejeonForecast).toHaveBeenCalledWith(36.36, 127.38);
  });

  it("좌표가 없으면 넘기지 않는다 — 어디를 기준으로 할지는 lib이 정한다", async () => {
    await request(app).get("/api/weather");

    expect(lib.fetchDaejeonForecast).toHaveBeenCalledWith(undefined, undefined);
  });

  it("기상청이 막히면 502로 사유를 실어 보낸다", async () => {
    lib.fetchDaejeonForecast.mockRejectedValue(new Error("공공데이터포털 요청 실패: 503"));

    const response = await request(app).get("/api/weather");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("공공데이터포털 요청 실패: 503");
  });

  it("사유를 알 수 없는 실패에도 빈 응답을 남기지 않는다", async () => {
    lib.fetchDaejeonForecast.mockRejectedValue("문자열로 던짐");

    const response = await request(app).get("/api/weather");

    expect(response.body.error).toBe("날씨 정보를 불러오지 못했어요");
  });
});
