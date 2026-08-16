"use client";

import { useState } from "react";
import type { Pet, Place } from "@/types";
import type { UpcomingTrip } from "@/lib/schedule";
import { cn } from "@/lib/cn";
import { CrowdTicker } from "./CrowdTicker";

const WEATHERS = ["☀️ 18°C · 맑음", "⛅ 22°C · 구름 조금", "🌤️ 25°C · 대체로 맑음", "🌥️ 20°C · 흐림"];

interface HomeStatusCardProps {
  pet: Pet | null;
  isLoggedIn: boolean;
  upcomingTrip: UpcomingTrip | null;
  crowdPlaces: Place[];
}

/**
 * 탑승권(보딩패스) 느낌의 홈 상태 카드.
 * 상단 모노 라벨 스트립 + 인사말/날씨 + 점선 절취선(양 끝을 페이지 배경색 원으로 "펀치홀"처럼
 * 도려내어 티켓 느낌을 냄) + 혼잡도 티커, 순서로 구성된다.
 */
export function HomeStatusCard({ pet, isLoggedIn, upcomingTrip, crowdPlaces }: HomeStatusCardProps) {
  const [weatherIndex, setWeatherIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => {
      setWeatherIndex((i) => (i + 1) % WEATHERS.length);
      setSpinning(false);
    }, 300);
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
            {WEATHERS[weatherIndex]} · 📍 유성구
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(
              "flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-card/75 text-[11px] text-brand-700",
              spinning && "animate-spin"
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
        <CrowdTicker places={crowdPlaces} />
      </div>
    </div>
  );
}
