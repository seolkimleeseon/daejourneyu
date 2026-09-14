import { afterEach, describe, expect, it, vi } from "vitest";
import { formatWeatherSummary, pickCurrentForecast, type WeatherForecast } from "@/lib/weather";

function forecast(overrides: Partial<WeatherForecast> = {}): WeatherForecast {
  return {
    date: "2026-09-14",
    time: "12:00",
    temperatureC: 18,
    precipitationChancePercent: 10,
    precipitationType: 0,
    skyCondition: 1,
    ...overrides,
  };
}

/** 예보 시각은 KST 기준이라 테스트도 KST로 현재 시각을 고정한다. */
function freezeAt(kst: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${kst}+09:00`));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("pickCurrentForecast", () => {
  it("예보가 없으면 null", () => {
    expect(pickCurrentForecast([])).toBeNull();
  });

  it("지금 이후로 가장 먼저 오는 예보를 고른다", () => {
    freezeAt("2026-09-14T13:00:00");

    const picked = pickCurrentForecast([
      forecast({ time: "09:00" }),
      forecast({ time: "12:00" }),
      forecast({ time: "15:00" }),
      forecast({ time: "18:00" }),
    ]);

    expect(picked?.time).toBe("15:00");
  });

  it("정각이면 그 시각 예보를 쓴다", () => {
    freezeAt("2026-09-14T15:00:00");

    expect(
      pickCurrentForecast([forecast({ time: "12:00" }), forecast({ time: "15:00" })])?.time
    ).toBe("15:00");
  });

  it("남은 예보가 모두 지났으면 마지막 것을 쓴다 — 빈 카드를 띄우지 않는다", () => {
    freezeAt("2026-09-14T23:00:00");

    expect(
      pickCurrentForecast([forecast({ time: "12:00" }), forecast({ time: "15:00" })])?.time
    ).toBe("15:00");
  });

  it("날짜가 넘어간 예보도 시각 순으로 따진다", () => {
    freezeAt("2026-09-14T23:30:00");

    const picked = pickCurrentForecast([
      forecast({ date: "2026-09-14", time: "21:00" }),
      forecast({ date: "2026-09-15", time: "00:00" }),
    ]);

    expect(picked).toMatchObject({ date: "2026-09-15", time: "00:00" });
  });
});

describe("formatWeatherSummary", () => {
  it.each([
    [1, "☀️ 18°C · 맑음"],
    [3, "⛅ 18°C · 구름 많음"],
    [4, "☁️ 18°C · 흐림"],
  ])("하늘 상태 %s를 문구로 옮긴다", (skyCondition, expected) => {
    expect(formatWeatherSummary(forecast({ skyCondition }))).toBe(expected);
  });

  it.each([
    [1, "🌧️ 18°C · 비"],
    [2, "🌨️ 18°C · 비/눈"],
    [3, "❄️ 18°C · 눈"],
    [4, "🌦️ 18°C · 소나기"],
  ])("강수 예보 %s는 하늘 상태보다 앞선다", (precipitationType, expected) => {
    // 비가 오는데 "맑음"이라고 쓰면 안 된다 — 강수가 있으면 그쪽을 보여준다.
    expect(formatWeatherSummary(forecast({ precipitationType, skyCondition: 1 }))).toBe(expected);
  });

  it("기온은 반올림한다", () => {
    expect(formatWeatherSummary(forecast({ temperatureC: 18.6 }))).toContain("19°C");
    expect(formatWeatherSummary(forecast({ temperatureC: -3.4 }))).toContain("-3°C");
  });

  it("기온이 없으면 '-'로 두고 나머지는 그대로 보여준다", () => {
    expect(formatWeatherSummary(forecast({ temperatureC: null }))).toBe("☀️ - · 맑음");
  });

  it("하늘 상태도 강수도 없으면 온도계 이모지만 붙인다", () => {
    expect(formatWeatherSummary(forecast({ skyCondition: null, precipitationType: null }))).toBe(
      "🌡️ 18°C"
    );
  });

  it("강수 없음(0)은 강수 예보로 치지 않는다", () => {
    expect(formatWeatherSummary(forecast({ precipitationType: 0, skyCondition: 3 }))).toBe(
      "⛅ 18°C · 구름 많음"
    );
  });
});
