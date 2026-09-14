import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./parks";

const lib = vi.hoisted(() => ({ fetchDaejeonParks: vi.fn() }));
vi.mock("../lib/parks", () => ({ fetchDaejeonParks: lib.fetchDaejeonParks }));

const app = createTestApp("/api/parks", router);

beforeEach(() => {
  lib.fetchDaejeonParks.mockReset();
  lib.fetchDaejeonParks.mockResolvedValue([]);
});

describe("GET /api/parks", () => {
  it("목록을 parks 키에 담아 돌려준다", async () => {
    lib.fetchDaejeonParks.mockResolvedValue([{ id: "1", name: "한밭수목원" }]);

    const response = await request(app).get("/api/parks");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ parks: [{ id: "1", name: "한밭수목원" }] });
  });

  it("쪽 번호와 개수를 숫자로 바꿔 넘긴다 — 쿼리는 늘 문자열로 들어온다", async () => {
    await request(app).get("/api/parks?numOfRows=20&pageNo=3");

    expect(lib.fetchDaejeonParks).toHaveBeenCalledWith(20, 3);
  });

  it("안 넘기면 기본값을 쓰게 둔다 — 라우트가 임의로 정하지 않는다", async () => {
    await request(app).get("/api/parks");

    expect(lib.fetchDaejeonParks).toHaveBeenCalledWith(undefined, undefined);
  });

  it("공공데이터가 실패하면 502로 사유를 실어 보낸다", async () => {
    lib.fetchDaejeonParks.mockRejectedValue(new Error("대전 도시공원정보 요청 실패: 503"));

    const response = await request(app).get("/api/parks");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("대전 도시공원정보 요청 실패: 503");
  });
});
