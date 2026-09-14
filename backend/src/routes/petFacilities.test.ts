import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./petFacilities";

/*
 * 동반 시설 목록을 그대로 실어 보내는 얇은 라우트다 — 데이터를 만드는 쪽은 lib 테스트가 따로 본다.
 * 여기서 지키는 건 응답 껍데기(키 이름)와, 공공데이터가 실패했을 때 500이 아니라 502로
 * 사유까지 실어 보내는지다.
 */
const lib = vi.hoisted(() => ({ fetchDaejeonPetFacilities: vi.fn() }));
vi.mock("../lib/petFacilities", () => ({ fetchDaejeonPetFacilities: lib.fetchDaejeonPetFacilities }));

const app = createTestApp("/api/pet-facilities", router);

beforeEach(() => {
  lib.fetchDaejeonPetFacilities.mockReset();
});

describe("GET /api/pet-facilities", () => {
  it("목록을 facilities 키에 담아 돌려준다 — 프론트가 이 이름으로 읽는다", async () => {
    lib.fetchDaejeonPetFacilities.mockResolvedValue([{ id: "a", name: "한밭수목원" }]);

    const response = await request(app).get("/api/pet-facilities");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ facilities: [{ id: "a", name: "한밭수목원" }] });
  });

  it("비어 있어도 빈 배열로 돌려준다 — 키 자체를 빼지 않는다", async () => {
    lib.fetchDaejeonPetFacilities.mockResolvedValue([]);

    const response = await request(app).get("/api/pet-facilities");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ facilities: [] });
  });

  it("공공데이터가 실패하면 502로 사유를 실어 보낸다 — 우리 잘못이 아니라 위쪽이 막힌 것이다", async () => {
    lib.fetchDaejeonPetFacilities.mockRejectedValue(new Error("공공데이터포털 요청 실패: 503"));

    const response = await request(app).get("/api/pet-facilities");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("공공데이터포털 요청 실패: 503");
  });

  it("사유를 알 수 없는 실패에도 빈 응답을 남기지 않는다", async () => {
    lib.fetchDaejeonPetFacilities.mockRejectedValue("문자열로 던짐");

    const response = await request(app).get("/api/pet-facilities");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("반려동물 동반 시설 정보를 불러오지 못했어요");
  });
});
