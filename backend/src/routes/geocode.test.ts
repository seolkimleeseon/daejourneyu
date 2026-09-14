import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./geocode";

const lib = vi.hoisted(() => ({ geocodeAddress: vi.fn() }));
vi.mock("../lib/kakaoLocal", () => ({ geocodeAddress: lib.geocodeAddress }));

const app = createTestApp("/api/geocode", router);

beforeEach(() => {
  lib.geocodeAddress.mockReset();
  lib.geocodeAddress.mockResolvedValue({ lat: 36.36, lng: 127.38 });
});

describe("GET /api/geocode", () => {
  it("찾은 좌표를 그대로 돌려준다", async () => {
    const response = await request(app).get("/api/geocode?address=대전광역시 유성구 온천로 9");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ lat: 36.36, lng: 127.38 });
    expect(lib.geocodeAddress).toHaveBeenCalledWith("대전광역시 유성구 온천로 9");
  });

  it("주소를 안 주면 400으로 무엇이 빠졌는지 알려준다 — 카카오를 부르지 않는다", async () => {
    const response = await request(app).get("/api/geocode");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("address");
    expect(lib.geocodeAddress).not.toHaveBeenCalled();
  });

  it("빈 주소도 마찬가지로 막는다", async () => {
    const response = await request(app).get("/api/geocode?address=");

    expect(response.status).toBe(400);
    expect(lib.geocodeAddress).not.toHaveBeenCalled();
  });

  it("못 찾은 주소는 404다 — 서버가 고장 난 것과 구분해야 한다", async () => {
    lib.geocodeAddress.mockResolvedValue(null);

    const response = await request(app).get("/api/geocode?address=없는주소");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("해당 주소로 좌표를 찾지 못했어요");
  });

  it("카카오가 막히면 502로 사유를 실어 보낸다", async () => {
    lib.geocodeAddress.mockRejectedValue(new Error("카카오 로컬 요청 실패: 429"));

    const response = await request(app).get("/api/geocode?address=대전");

    expect(response.status).toBe(502);
    expect(response.body.error).toBe("카카오 로컬 요청 실패: 429");
  });
});
