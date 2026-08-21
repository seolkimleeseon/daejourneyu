"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { FestivalLinks } from "@/components/home/FestivalLinks";
import { usePlaces } from "@/hooks/usePlaces";
import { useReviews } from "@/hooks/useReviews";
import { mockFestivals } from "@/mocks";
import { computeMonthlyBriefing } from "@/lib/briefing";
import { cn } from "@/lib/cn";

export default function WeeklyBriefingPage() {
  const router = useRouter();
  const { data: places = [] } = usePlaces();
  const { data: reviews = [] } = useReviews();

  const monthYm = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const monthLabel = `${Number(monthYm.slice(5, 7))}월`;

  const { monthFestivals, topPlaces, walkPick } = useMemo(
    () => computeMonthlyBriefing(places, reviews, mockFestivals, monthYm),
    [places, reviews, monthYm]
  );

  return (
    <>
      <TopBar title="이달의 대전 브리핑" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">이번 달 신규 소식</div>
        <Card className="cursor-default bg-accent-amber-light">
          <div className="text-[11px] font-semibold text-accent-amber">
            ☕ 신규 카페 · 🍽️ 신규 맛집 소식을 준비하고 있어요
          </div>
          <div className="mt-1 text-[9px] text-ink-muted">
            * 대전 인프라 데이터 연동 예정 — 지금은 목데이터 기준이에요
          </div>
        </Card>

        <div className="mb-2 mt-5 px-1 text-xs font-bold text-ink-muted">{monthLabel} 대전 축제</div>
        {monthFestivals.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-muted">이번 달 등록된 축제가 없어요</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {monthFestivals.map((festival) => (
              <Card
                key={festival.id}
                className={cn(
                  "border-l-[3px]",
                  festival.petFriendly ? "border-l-brand" : "border-l-accent-amber"
                )}
                onClick={() => router.push(`/place/${encodeURIComponent(festival.place)}`)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{festival.title}</span>
                  <FestivalLinks festival={festival} />
                </div>
                <div className="mt-1 text-[11px] text-ink-muted">
                  {festival.date} · {festival.place}
                </div>
                {festival.petFriendly ? (
                  <Tag tone="brand" className="mt-1.5 cursor-default px-2 py-1 text-[10px]">
                    반려동물 동반 가능
                  </Tag>
                ) : null}
              </Card>
            ))}
          </div>
        )}

        <div className="mb-2 mt-5 px-1 text-xs font-bold text-ink-muted">인기 장소 TOP3</div>
        {topPlaces.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-muted">불러올 인기 장소가 없어요</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {topPlaces.map((place, index) => (
              <Card key={place.id} onClick={() => router.push(`/place/${encodeURIComponent(place.name)}`)}>
                <div className="text-sm font-bold text-ink">
                  {index + 1}. {place.name}
                </div>
                <div className="mt-1 text-[11px] text-ink-muted">
                  {place.district} · {place.category}
                </div>
              </Card>
            ))}
          </div>
        )}

        {walkPick ? (
          <>
            <div className="mb-2 mt-5 px-1 text-xs font-bold text-ink-muted">추천 산책로</div>
            <Card onClick={() => router.push(`/place/${encodeURIComponent(walkPick.name)}`)}>
              <div className="text-sm font-bold text-ink">{walkPick.name}</div>
              <div className="mt-1 text-[11px] text-ink-muted">
                {walkPick.district} · {walkPick.condition}
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}
