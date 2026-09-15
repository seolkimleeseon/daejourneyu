import { useQuery } from "@tanstack/react-query";
import type { WeatherResponse } from "@/lib/weather";
import { apiUrl } from "@/lib/api/authFetch";

function getBrowserCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null), // 권한 거부/실패 시 좌표 없이 진행 — 백엔드가 대전시청으로 대체한다
      { timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function fetchWeather(fixedCoords?: { lat: number; lng: number }): Promise<WeatherResponse> {
  const coords = fixedCoords ?? (await getBrowserCoords());
  const search = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
  const res = await fetch(apiUrl(`/api/weather${search}`));
  if (!res.ok) throw new Error("날씨 정보를 불러오지 못했어요");
  return (await res.json()) as WeatherResponse;
}

interface UseWeatherOptions {
  /** 지정하면 브라우저 위치 대신 이 좌표 기준으로 예보를 가져온다(예: 장소별 날씨 티커). */
  lat?: number;
  lng?: number;
  /** false면 쿼리를 보내지 않는다 — 좌표를 아직 모르는 장소를 건너뛸 때 쓴다. */
  enabled?: boolean;
}

/**
 * 좌표를 지정하지 않으면 브라우저 위치 권한이 있고 대전 안이면 그 위치 기준, 아니면(권한 거부·대전
 * 밖) 대전시청 기준으로 날씨를 가져온다 — "대전 여부 판별/시청 대체"는 백엔드(`/api/weather`)가
 * 처리한다. 좌표를 지정하면(`lat`/`lng`) 그 지점 기준으로 바로 조회한다.
 */
export function useWeather({ lat, lng, enabled = true }: UseWeatherOptions = {}) {
  const hasFixedCoords = lat !== undefined && lng !== undefined;
  return useQuery({
    queryKey: hasFixedCoords ? ["weather", "at", lat, lng] : ["weather", "auto"],
    queryFn: () => fetchWeather(hasFixedCoords ? { lat, lng } : undefined),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
