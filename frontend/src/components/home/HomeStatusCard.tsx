"use client";

import { useState } from "react";
import type { Pet } from "@/types";
import type { ActiveTrip } from "@/lib/schedule";
import type { CrowdPlace } from "@/lib/crowd";
import { cn } from "@/lib/cn";
import { CrowdTicker } from "./CrowdTicker";
import { useWeather } from "@/hooks/useWeather";
import { formatWeatherSummary, pickCurrentForecast } from "@/lib/weather";

interface HomeStatusCardProps {
  pet: Pet | null;
  isLoggedIn: boolean;
  upcomingTrip: ActiveTrip | null;
  crowdPlaces: CrowdPlace[];
  /** 장소 목록을 아직 불러오는 중인지 — 티커에 빈칸 대신 안내 문구를 보이기 위해 내려준다. */
  crowdLoading?: boolean;
}

/**
 * 탑승권(보딩패스) 느낌의 홈 상태 카드.
 * 상단 모노 라벨 스트립 + 인사말/날씨 + 점선 절취선(양 끝을 페이지 배경색 원으로 "펀치홀"처럼
 * 도려내어 티켓 느낌을 냄) + 혼잡도 티커, 순서로 구성된다.
 */
export function HomeStatusCard({
  pet,
  isLoggedIn,
  upcomingTrip,
  crowdPlaces,
  crowdLoading = false,
}: HomeStatusCardProps) {
  const { data, isFetching, isError, refetch } = useWeather();
  const current = data ? pickCurrentForecast(data.forecast) : null;
  const weatherText = isError ? "날씨 정보 없음" : current ? formatWeatherSummary(current) : "날씨 불러오는 중…";
  const district = data?.district ?? "대전";

  // 기상청 예보는 3시간마다만 바뀌어 새로고침해도 값이 그대로일 때가 많다 — 눌렸다는 걸
  // 알 수 있게 아이콘을 최소 시간 회전시킨다.
  const [spinning, setSpinning] = useState(false);
  const handleRefresh = () => {
    setSpinning(true);
    void refetch().finally(() => setTimeout(() => setSpinning(false), 600));
  };

  const greeting = upcomingTrip
    ? upcomingTrip.courseLabel
    : isLoggedIn && pet
      ? `${pet.name}와 오늘은 어디로 갈까요?`
      : "오늘 대전 어디로 갈까요?";

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl bg-brand-100 shadow-sm">
      <div className="flex items-center justify-between px-4 pt-3 font-mono text-[9px] font-bold tracking-widest text-brand-700/70">
        <span>오늘의 산책 TICKET</span>
        <span>DAEJEON</span>
      </div>

      <div className="px-4 pb-3 pt-2.5">
        <div className="mb-1.5 flex items-center gap-2">
          {upcomingTrip ? (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-coral px-2.5 py-1 text-[11px] font-extrabold text-white">
              {upcomingTrip.ddayLabel}
            </span>
          ) : null}
          <span className="truncate text-[15px] font-extrabold tracking-tight text-brand-700">
            {greeting}
          </span>
          {isLoggedIn && pet ? (
            <span className="ml-auto shrink-0 rounded-full border border-brand-300 bg-card px-2.5 py-1 text-[10px] font-bold text-brand-700">
              {pet.name}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-brand-700">
            {weatherText} · 📍 {district}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="날씨 새로고침"
            className={cn(
              "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-card/75 text-[11px] text-brand-700",
              (isFetching || spinning) && "animate-spin"
            )}
          >
            ↻
          </button>
        </div>
      </div>

      <div className="relative mx-3.5 h-0 border-t border-dashed border-brand-700/25">
        <span className="absolute -left-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
        <span className="absolute -right-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
      </div>

      <div className="px-4 py-2">
        <CrowdTicker places={crowdPlaces} loading={crowdLoading} />
      </div>
    </div>
  );
}
