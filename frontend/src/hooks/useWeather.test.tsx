import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWeather } from "@/hooks/useWeather";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

const fetchMock = vi.fn();
const getCurrentPosition = vi.fn();

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

const response = {
  district: "유성구",
  forecast: [
    {
      date: "2026-09-14",
      time: "15:00",
      temperatureC: 18,
      precipitationChancePercent: 10,
      precipitationType: 0,
      skyCondition: 1,
    },
  ],
};

beforeEach(() => {
  fetchMock.mockReset();
  getCurrentPosition.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useWeather", () => {
  it("위치 권한이 있으면 좌표를 붙여 부른다", async () => {
    getCurrentPosition.mockImplementation((onSuccess: PositionCallback) =>
      onSuccess({ coords: { latitude: 36.36, longitude: 127.35 } } as GeolocationPosition)
    );

    const { result } = renderWithClient(() => useWeather());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = new URL(fetchMock.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("lat")).toBe("36.36");
    expect(url.searchParams.get("lng")).toBe("127.35");
    expect(result.current.data).toEqual(response);
  });

  it("권한을 거부하면 좌표 없이 부른다 — 백엔드가 시청 기준으로 대체한다", async () => {
    getCurrentPosition.mockImplementation((_ok: PositionCallback, onError: () => void) =>
      onError()
    );

    const { result } = renderWithClient(() => useWeather());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/api/weather");
  });

  it("위치 기능이 없는 환경에서도 좌표 없이 진행한다", async () => {
    vi.stubGlobal("navigator", {});

    const { result } = renderWithClient(() => useWeather());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/api/weather");
  });

  it("서버가 실패하면 오류로 둔다 — 날씨는 목데이터 폴백이 없다", async () => {
    getCurrentPosition.mockImplementation((_ok: PositionCallback, onError: () => void) =>
      onError()
    );
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const { result } = renderWithClient(() => useWeather());
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

    expect(result.current.data).toBeUndefined();
  });
});
