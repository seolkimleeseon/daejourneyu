"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TickerPlace } from "@/lib/placeTicker";
import { CATEGORY_ICON } from "@/lib/placeFilters";
import { useWeather } from "@/hooks/useWeather";
import { formatWeatherShort, pickCurrentForecast } from "@/lib/weather";
import { cn } from "@/lib/cn";

interface PlaceWeatherTickerProps {
  places: TickerPlace[];
  /** 장소 목록을 아직 불러오는 중인지 — true면 빈칸 대신 "불러오는 중" 안내를 보인다. */
  loading?: boolean;
}

const ROW_HEIGHT = 36;
const INTERVAL_MS = 2200;
const TRANSITION_MS = 500;

/**
 * 좌표가 있는 장소는 그 지점 기준 날씨 배지를 보여준다. 아직 못 불러왔거나(로딩 중) 좌표가
 * 없거나(코스에서 온 장소) 에러가 났으면 "상세보기"를 기본값으로 보이다가, 날씨가 도착하면
 * 그 자리에서 텍스트만 바뀐다 — 줄 전체가 이미 그 장소 상세로 가는 버튼이라 같은 동작을
 * 가리킨다. 배지 자체를 비웠다 채웠다 하면(null 반환) 그 자리가 깜빡여 보이므로, 항상 같은
 * 배지를 렌더링한 채 안의 텍스트만 교체한다.
 */
function TickerWeatherBadge({ lat, lng }: { lat?: number; lng?: number }) {
  const hasCoords = lat !== undefined && lng !== undefined;
  const { data } = useWeather({ lat, lng, enabled: hasCoords });
  const current = data ? pickCurrentForecast(data.forecast) : null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-lg bg-card px-2.5 py-1 text-[9px] font-bold shadow-sm",
        current ? "text-brand-700" : "text-brand-700/70"
      )}
    >
      {current ? formatWeatherShort(current) : "상세보기"}
    </span>
  );
}

/**
 * 홈 상태 카드 안에서 장소와 그 지점 날씨를 위로 끊김 없이 슬라이드하며 보여주는 티커.
 * 마지막 다음에 첫 항목을 한 번 더 복제해두고, 그 지점에 도달하면 트랜지션을 끈 채
 * 순간적으로 0번으로 되돌린 뒤 다시 트랜지션을 켜는 방식으로 무한 루프처럼 보이게 한다.
 */
export function PlaceWeatherTicker({ places, loading = false }: PlaceWeatherTickerProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    setIndex(0);
    setInstant(false);
  }, [places]);

  useEffect(() => {
    if (places.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => i + 1), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [places.length]);

  useEffect(() => {
    if (places.length <= 1 || index !== places.length) return;
    const resetTimer = setTimeout(() => {
      setInstant(true);
      setIndex(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    }, TRANSITION_MS + 20);
    return () => clearTimeout(resetTimer);
  }, [index, places.length]);

  if (places.length === 0) {
    return (
      <div className="flex h-9 items-center gap-1.5 text-[11px] font-semibold text-brand-700/70">
        <span>🐾</span>
        <span className="truncate">
          {loading
            ? "대전 곳곳의 반려동물 동반 장소를 모으고 있어요"
            : "지금은 표시할 장소가 없어요"}
        </span>
      </div>
    );
  }

  const loopPlaces = places.length > 1 ? [...places, places[0]] : places;

  return (
    <div className="h-9 overflow-hidden">
      <div
        className={cn("flex flex-col", !instant && "transition-transform ease-out")}
        style={{
          transform: `translateY(-${index * ROW_HEIGHT}px)`,
          transitionDuration: instant ? "0ms" : `${TRANSITION_MS}ms`,
        }}
      >
        {loopPlaces.map((place, i) => (
          <button
            key={`${place.id}-${i}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/place/${encodeURIComponent(place.name)}`);
            }}
            className="flex h-9 shrink-0 items-center justify-between"
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate text-[11px] font-semibold text-ink">
              <span>{CATEGORY_ICON[place.category]}</span>
              <span className="truncate">{place.name}</span>
            </span>
            <TickerWeatherBadge lat={place.lat} lng={place.lng} />
          </button>
        ))}
      </div>
    </div>
  );
}
