import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 실제 응답 스키마를 상상해 고정하지 않는다 — 여기서 보는 건 "이런 모양이 들어오면 화면이 쓰는
 * 모양으로 어떻게 바꾸는가"다. 카테고리 코드(TMP·POP·PTY·SKY)와 봉투 모양은 weather.ts가
 * 이미 타입으로 못박아 둔 것을 그대로 쓴다.
 */
const fetchMock = vi.fn();

const kakao = vi.hoisted(() => ({ reverseGeocode: vi.fn() }));
vi.mock("./kakaoLocal", () => ({ reverseGeocode: kakao.reverseGeocode }));

/**
 * 캐시가 모듈 전역 Map이라 테스트끼리 결과가 새어 나간다 — 케이스마다 모듈을 새로 불러
 * 캐시를 비운 상태에서 시작한다(캐시 자체를 보는 테스트만 한 모듈 안에서 두 번 부른다).
 */
async function loadWeather() {
  vi.resetModules();
  return import("./weather");
}

/** 대전 안 좌표 하나 — 어느 구인지는 reverseGeocode 목이 정한다. */
const SPOT = { lat: 36.36, lng: 127.38 };

function item(overrides: Record<string, unknown> = {}) {
  return {
    baseDate: "20260914",
    baseTime: "1100",
    category: "TMP",
    fcstDate: "20260914",
    fcstTime: "1500",
    fcstValue: "18",
    nx: 67,
    ny: 100,
    ...overrides,
  };
}

/** 응답 본문은 한 번만 읽을 수 있어 호출마다 새로 만든다. */
function giveForecast(items: unknown[]) {
  fetchMock.mockImplementation(async () => (
    new Response(
      JSON.stringify({
        response: {
          header: { resultCode: "00", resultMsg: "NORMAL_SERVICE" },
          body: { items: { item: items }, numOfRows: items.length, pageNo: 1, totalCount: items.length },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  ));
}

beforeEach(() => {
  fetchMock.mockReset();
  kakao.reverseGeocode.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  giveForecast([item()]);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("열쇠가 없을 때", () => {
  it("어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonForecast } = await loadWeather();

    await expect(fetchDaejeonForecast()).rejects.toThrow(/backend\/.env/);
  });
});

describe("어디 날씨를 보여줄지", () => {
  it("좌표가 없으면 대전시청 기준으로 본다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();

    const result = await fetchDaejeonForecast();

    expect(result.district).toBe("대전시청");
    expect(kakao.reverseGeocode).not.toHaveBeenCalled();
  });

  it("대전 안이면 그 구 이름을 그대로 쓴다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    kakao.reverseGeocode.mockResolvedValue({ city: "대전광역시", district: "유성구" });

    const result = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(result.district).toBe("유성구");
  });

  it("대전 밖이면 그 지역 이름을 쓰지 않는다 — 거기 있는 것처럼 보이면 안 된다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    kakao.reverseGeocode.mockResolvedValue({ city: "서울특별시", district: "강남구" });

    const result = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(result.district).toBe("대전시청");
  });

  it("역지오코딩이 실패해도 날씨는 보여준다 — 위치를 모른다고 막을 이유가 없다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    kakao.reverseGeocode.mockRejectedValue(new Error("카카오 응답 없음"));

    const result = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(result.district).toBe("대전시청");
    expect(result.forecast).toHaveLength(1);
  });
});

describe("예보 묶기", () => {
  it("같은 시각의 여러 항목을 한 줄로 합친다 — 원본은 항목마다 값이 하나씩 온다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([
      item({ category: "TMP", fcstValue: "18" }),
      item({ category: "POP", fcstValue: "30" }),
      item({ category: "PTY", fcstValue: "1" }),
      item({ category: "SKY", fcstValue: "4" }),
    ]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast).toEqual([
      {
        date: "2026-09-14",
        time: "15:00",
        temperatureC: 18,
        precipitationChancePercent: 30,
        precipitationType: 1,
        skyCondition: 4,
      },
    ]);
  });

  it("YYYYMMDD·HHmm을 화면이 쓰는 모양으로 바꾼다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([item({ fcstDate: "20261103", fcstTime: "0900" })]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast[0]).toMatchObject({ date: "2026-11-03", time: "09:00" });
  });

  it("안 온 값은 0이 아니라 비워 둔다 — 0도와 '모름'은 다르다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([item({ category: "TMP", fcstValue: "18" })]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast[0]).toMatchObject({
      temperatureC: 18,
      precipitationChancePercent: null,
      precipitationType: null,
      skyCondition: null,
    });
  });

  it("모르는 카테고리는 조용히 흘려보낸다 — 새 코드가 늘어도 터지지 않게", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([item({ category: "WSD", fcstValue: "3.4" }), item({ category: "TMP", fcstValue: "18" })]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast).toHaveLength(1);
    expect(forecast[0].temperatureC).toBe(18);
  });

  it("시간순으로 세운다 — 원본은 카테고리 순으로 섞여 온다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([
      item({ fcstDate: "20260915", fcstTime: "0900" }),
      item({ fcstDate: "20260914", fcstTime: "2100" }),
      item({ fcstDate: "20260914", fcstTime: "1500" }),
    ]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast.map((f) => `${f.date} ${f.time}`)).toEqual([
      "2026-09-14 15:00",
      "2026-09-14 21:00",
      "2026-09-15 09:00",
    ]);
  });

  it("예보가 비어 있어도 빈 목록으로 돌려준다 — 던지지 않는다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();
    giveForecast([]);

    const { forecast } = await fetchDaejeonForecast(SPOT.lat, SPOT.lng);

    expect(forecast).toEqual([]);
  });
});

describe("요청", () => {
  it("좌표를 격자로 바꿔 넘긴다 — API는 위경도를 안 받는다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();

    await fetchDaejeonForecast();

    const url = String(fetchMock.mock.lastCall?.[0]);
    expect(url).toContain("nx=67");
    expect(url).toContain("ny=100");
    expect(url).toContain("dataType=JSON");
  });

  it("같은 격자·같은 발표분은 한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonForecast } = await loadWeather();

    await fetchDaejeonForecast();
    await fetchDaejeonForecast();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
