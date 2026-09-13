import { describe, expect, it } from "vitest";
import { DAEJEON_CITY_HALL, getLatestForecastBaseDateTime, latLngToGrid } from "./weatherGrid";

describe("latLngToGrid", () => {
  it("서울시청 좌표를 기상청 격자 (60, 127)로 변환한다", () => {
    expect(latLngToGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 });
  });

  it("대전시청 좌표를 기상청 격자 (67, 100)으로 변환한다", () => {
    expect(latLngToGrid(DAEJEON_CITY_HALL.lat, DAEJEON_CITY_HALL.lng)).toEqual({ nx: 67, ny: 100 });
  });
});

describe("getLatestForecastBaseDateTime", () => {
  // new Date(연, 월-1, 일, 시, 분)은 로컬 시각 기준이라 실행 환경의 타임존과 무관하게 결과가 같다.
  it("발표 후 10분이 안 지났으면 직전 발표 시각을 쓴다", () => {
    expect(getLatestForecastBaseDateTime(new Date(2026, 8, 13, 14, 5))).toEqual({
      baseDate: "20260913",
      baseTime: "1100",
    });
  });

  it("발표 후 정확히 10분이 지나면 그 발표 시각을 쓴다", () => {
    expect(getLatestForecastBaseDateTime(new Date(2026, 8, 13, 14, 10))).toEqual({
      baseDate: "20260913",
      baseTime: "1400",
    });
  });

  it("자정 직후에는 전날 23시 발표분을 쓴다", () => {
    expect(getLatestForecastBaseDateTime(new Date(2026, 8, 13, 1, 30))).toEqual({
      baseDate: "20260912",
      baseTime: "2300",
    });
  });

  it("월 첫날 자정 직후에는 전달 마지막 날로 넘어간다", () => {
    expect(getLatestForecastBaseDateTime(new Date(2026, 9, 1, 0, 30))).toEqual({
      baseDate: "20260930",
      baseTime: "2300",
    });
  });
});
