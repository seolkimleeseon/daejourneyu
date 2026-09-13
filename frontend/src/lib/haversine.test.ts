import { describe, expect, it } from "vitest";
import { haversine } from "@/lib/haversine";

const SEOUL_CITY_HALL = { lat: 37.5665, lng: 126.978 };
const DAEJEON_CITY_HALL = { lat: 36.3504, lng: 127.3845 };

describe("haversine", () => {
  it("같은 좌표 사이 거리는 0이다", () => {
    expect(haversine(DAEJEON_CITY_HALL, DAEJEON_CITY_HALL)).toBe(0);
  });

  it("경선을 따라 위도 1도는 약 111.19km다", () => {
    expect(haversine({ lat: 36, lng: 127 }, { lat: 37, lng: 127 })).toBeCloseTo(111.19, 1);
  });

  it("출발·도착을 바꿔도 거리가 같다", () => {
    expect(haversine(SEOUL_CITY_HALL, DAEJEON_CITY_HALL)).toBeCloseTo(
      haversine(DAEJEON_CITY_HALL, SEOUL_CITY_HALL),
      10
    );
  });

  it("서울시청–대전시청 직선거리는 약 140km다", () => {
    const km = haversine(SEOUL_CITY_HALL, DAEJEON_CITY_HALL);
    expect(km).toBeGreaterThan(138);
    expect(km).toBeLessThan(142);
  });
});
