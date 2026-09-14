import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DAEJEON_OPEN_API_DATASETS } from "../lib/daejeonOpenApi";
import { createTestApp } from "../test/testApp";
import router from "./daejeon";

const lib = vi.hoisted(() => ({ fetchDaejeonOpenApi: vi.fn() }));
vi.mock("../lib/daejeonOpenApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/daejeonOpenApi")>()),
  fetchDaejeonOpenApi: lib.fetchDaejeonOpenApi,
}));

const app = createTestApp("/api/daejeon", router);

beforeEach(() => {
  lib.fetchDaejeonOpenApi.mockReset();
  lib.fetchDaejeonOpenApi.mockResolvedValue({ response: { body: { items: [] } } });
});

describe("GET /api/daejeon/:dataset", () => {
  it("응답을 손대지 않고 그대로 흘려보낸다 — 해석은 호출부 몫이다", async () => {
    lib.fetchDaejeonOpenApi.mockResolvedValue({ response: { body: { items: [{ fcltyNm: "예술의전당" }] } } });

    const response = await request(app).get("/api/daejeon/culture");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ response: { body: { items: [{ fcltyNm: "예술의전당" }] } } });
  });

  it("여섯 데이터셋을 모두 받아준다", async () => {
    for (const dataset of Object.keys(DAEJEON_OPEN_API_DATASETS)) {
      const response = await request(app).get(`/api/daejeon/${dataset}`);

      expect(response.status, dataset).toBe(200);
      expect(lib.fetchDaejeonOpenApi.mock.lastCall?.[0], dataset).toBe(dataset);
    }
  });

  it("모르는 데이터셋은 400으로 막고 고를 수 있는 값을 알려준다", async () => {
    const response = await request(app).get("/api/daejeon/없는것");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("culture");
    expect(lib.fetchDaejeonOpenApi).not.toHaveBeenCalled();
  });

  it("쪽 번호와 개수를 숫자로 바꿔 넘긴다", async () => {
    await request(app).get("/api/daejeon/culture?pageNo=2&numOfRows=200");

    expect(lib.fetchDaejeonOpenApi).toHaveBeenCalledWith("culture", { pageNo: 2, numOfRows: 200 });
  });

  it("공공데이터가 실패하면 502로 사유를 실어 보낸다", async () => {
    lib.fetchDaejeonOpenApi.mockRejectedValue(new Error("공공데이터포털 응답이 JSON이 아니에요: <html>"));

    const response = await request(app).get("/api/daejeon/culture");

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("JSON이 아니에요");
  });
});
