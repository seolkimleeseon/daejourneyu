import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./petTourSpots";

const lib = vi.hoisted(() => ({ fetchDaejeonPetTourSpots: vi.fn() }));
vi.mock("../lib/petTourSpots", () => ({ fetchDaejeonPetTourSpots: lib.fetchDaejeonPetTourSpots }));

const app = createTestApp("/api/pet-tour-spots", router);

/** 마지막 조회에 넘어간 조건. */
function lastOptions() {
  return lib.fetchDaejeonPetTourSpots.mock.lastCall?.[0];
}

beforeEach(() => {
  lib.fetchDaejeonPetTourSpots.mockReset();
  lib.fetchDaejeonPetTourSpots.mockResolvedValue([]);
});

describe("GET /api/pet-tour-spots", () => {
  it("목록을 spots 키에 담아 돌려준다", async () => {
    lib.fetchDaejeonPetTourSpots.mockResolvedValue([{ id: "1", name: "한밭수목원" }]);

    const response = await request(app).get("/api/pet-tour-spots");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ spots: [{ id: "1", name: "한밭수목원" }] });
  });

  it("아는 관광타입은 그대로 넘긴다", async () => {
    await request(app).get("/api/pet-tour-spots?contentTypeId=39");

    expect(lastOptions()).toMatchObject({ contentTypeId: "39" });
  });

  it("모르는 관광타입은 400이 아니라 '전체'로 다룬다 — 링크 하나 틀렸다고 빈 화면을 주지 않는다", async () => {
    await request(app).get("/api/pet-tour-spots?contentTypeId=99");

    expect(lastOptions()).toMatchObject({ contentTypeId: undefined });
  });

  it("구 코드는 문자열 그대로, 쪽·개수는 숫자로 바꿔 넘긴다", async () => {
    await request(app).get("/api/pet-tour-spots?sigunguCode=1&pageNo=2&numOfRows=30");

    expect(lastOptions()).toMatchObject({ sigunguCode: "1", pageNo: 2, numOfRows: 30 });
  });

  it("빈 구 코드는 넘기지 않는다 — 빈 문자열이 조회 조건에 실리면 결과가 사라진다", async () => {
    await request(app).get("/api/pet-tour-spots?sigunguCode=");

    expect(lastOptions()).toMatchObject({ sigunguCode: undefined });
  });

  it("공공데이터가 실패하면 502로 사유를 실어 보낸다", async () => {
    lib.fetchDaejeonPetTourSpots.mockRejectedValue(new Error("공공데이터포털 요청 실패: 503"));

    const response = await request(app).get("/api/pet-tour-spots");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("공공데이터포털 요청 실패: 503");
  });
});
