"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { computeCrowdLevel, type CrowdLevel, type CrowdPlace } from "@/lib/crowd";
import { CATEGORY_ICON } from "@/lib/placeFilters";
import { cn } from "@/lib/cn";

interface CrowdTickerProps {
  places: CrowdPlace[];
  /** 장소 목록을 아직 불러오는 중인지 — true면 빈칸 대신 "불러오는 중" 안내를 보인다. */
  loading?: boolean;
}

const LEVEL_CLASS: Record<CrowdLevel, string> = {
  여유: "bg-card text-brand-700",
  보통: "bg-card text-accent-amber",
  혼잡: "bg-accent-coral-light text-accent-coral",
};

const ROW_HEIGHT = 36;
const INTERVAL_MS = 2200;
const TRANSITION_MS = 500;

/**
 * 홈 상태 카드 안에서 장소 혼잡도를 위로 끊김 없이 슬라이드하며 보여주는 티커.
 * 마지막 다음에 첫 항목을 한 번 더 복제해두고, 그 지점에 도달하면 트랜지션을 끈 채
 * 순간적으로 0번으로 되돌린 뒤 다시 트랜지션을 켜는 방식으로 무한 루프처럼 보이게 한다.
 */
export function CrowdTicker({ places, loading = false }: CrowdTickerProps) {
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
        {loopPlaces.map((place, i) => {
          const level = computeCrowdLevel(place.name);
          return (
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
              <span
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-bold shadow-sm",
                  LEVEL_CLASS[level]
                )}
              >
                {level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
