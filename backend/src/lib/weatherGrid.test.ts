import { describe, expect, it } from "vitest";
import { DAEJEON_CITY_HALL, getLatestForecastBaseDateTime, latLngToGrid } from "./weatherGrid";

/*
 * 격자 변환은 기상청이 공개한 LCC DFS 공식이라 정답이 밖에 있다 — 우리 출력이 아니라
 * 기상청이 배포하는 "단기예보 지점 좌표" 표의 값을 기준으로 잡는다.
 */
describe("위경도 → 기상청 격자", () => {
  it("대전 시청은 67, 100이다", () => {
    expect(latLngToGrid(DAEJEON_CITY_HALL.lat, DAEJEON_CITY_HALL.lng)).toEqual({ nx: 67, ny: 100 });
  });

  it("서울·부산·제주·강릉도 배포된 지점 좌표와 맞는다", () => {
    expect(latLngToGrid(37.5665, 126.978)).toEqual({ nx: 60, ny: 127 });
    expect(latLngToGrid(35.1796, 129.0756)).toEqual({ nx: 98, ny: 76 });
    expect(latLngToGrid(33.4996, 126.5312)).toEqual({ nx: 53, ny: 38 });
    expect(latLngToGrid(37.7519, 128.8761)).toEqual({ nx: 92, ny: 132 });
  });

  it("동쪽으로 갈수록 nx가 커지고 북쪽으로 갈수록 ny가 커진다", () => {
    const 대전 = latLngToGrid(36.3504, 127.3845);
    const 동쪽 = latLngToGrid(36.3504, 128.0);
    const 북쪽 = latLngToGrid(37.0, 127.3845);

    expect(동쪽.nx).toBeGreaterThan(대전.nx);
    expect(북쪽.ny).toBeGreaterThan(대전.ny);
  });

  it("투영 기준점(북위 38° · 동경 126°)은 격자 기준점 43, 136으로 떨어진다", () => {
    expect(latLngToGrid(38.0, 126.0)).toEqual({ nx: 43, ny: 136 });
  });

  it("격자 좌표는 언제나 정수다 — API가 정수만 받는다", () => {
    const { nx, ny } = latLngToGrid(36.35555, 127.38888);

    expect(Number.isInteger(nx)).toBe(true);
    expect(Number.isInteger(ny)).toBe(true);
  });
});

/*
 * 단기예보는 하루 8번(02·05·08·11·14·17·20·23시) 발표되고 발표 10분 뒤부터 조회된다.
 * 아직 안 나온 발표분을 달라고 하면 빈 응답이 오므로, 경계 근처를 특히 따진다.
 */
describe("가장 최근 발표 시각", () => {
  const at = (iso: string) => getLatestForecastBaseDateTime(new Date(iso));

  it("발표 직후 10분 동안은 아직 이전 발표분을 쓴다", () => {
    expect(at("2026-09-14T02:05:00")).toEqual({ baseDate: "20260913", baseTime: "2300" });
  });

  it("10분이 지나면 그날 발표분으로 넘어간다", () => {
    expect(at("2026-09-14T02:15:00")).toEqual({ baseDate: "20260914", baseTime: "0200" });
  });

  it("발표 시각 사이에서는 직전 발표분을 쓴다", () => {
    expect(at("2026-09-14T13:00:00")).toEqual({ baseDate: "20260914", baseTime: "1100" });
  });

  it("자정 직후엔 전날 23시 발표분으로 돌아간다 — 오늘 발표분이 아직 없다", () => {
    expect(at("2026-09-14T00:05:00")).toEqual({ baseDate: "20260913", baseTime: "2300" });
  });

  it("해가 바뀌는 자정도 전날로 제대로 넘어간다", () => {
    expect(at("2027-01-01T00:30:00")).toEqual({ baseDate: "20261231", baseTime: "2300" });
  });

  it("23시 발표 뒤로는 그날 23시분을 쓴다", () => {
    expect(at("2026-09-14T23:30:00")).toEqual({ baseDate: "20260914", baseTime: "2300" });
  });

  it("날짜는 YYYYMMDD, 시각은 HHmm로 0을 채워 넘긴다", () => {
    const { baseDate, baseTime } = at("2026-01-05T09:00:00");

    expect(baseDate).toBe("20260105");
    expect(baseTime).toBe("0800");
  });
});
