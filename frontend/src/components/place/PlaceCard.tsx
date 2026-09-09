"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Place } from "@/types";
import { CATEGORY_ICON, getConditionTags } from "@/lib/placeFilters";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const router = useRouter();
  // 외부(공공데이터·카카오) 이미지 URL은 원본이 내려가거나 만료돼 깨져 있는 경우가 있다 —
  // 로드 실패하면 깨진 이미지 아이콘 대신 이모지 카드로 조용히 전환한다.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = place.imageUrl && !imageFailed;
  const conditionTags = getConditionTags(place.condition, place.smallDogOnly);

  return (
    <button
      type="button"
      onClick={() => router.push(`/place/${encodeURIComponent(place.name)}`)}
      className="overflow-hidden rounded-xl border border-line bg-card text-left transition-colors active:bg-surface"
    >
      <div className="relative aspect-[4/3] w-full bg-surface">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.imageUrl ?? undefined}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            {CATEGORY_ICON[place.category]}
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
          {CATEGORY_ICON[place.category]} {place.category}
        </span>
        {!place.petFriendly ? (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-accent-coral px-2 py-0.5 text-[10px] font-semibold text-white">
            🚫 동반 불가
          </span>
        ) : null}
      </div>
      <div className="p-2">
        <div className="truncate text-xs font-bold text-ink">{place.name}</div>
        <div className="mt-0.5 truncate text-[10px] text-ink-muted">📍 {place.district}</div>
        {/* 칩이 없는 카드도 같은 자리를 차지해야 2열 그리드에서 사진 크기·카드 높이가 어긋나지
         * 않는다 — 그래서 태그가 없어도 이 줄을 접지 않고 고정 높이로 항상 그린다. 줄바꿈도
         * 막아(overflow-hidden, no flex-wrap) 태그 개수와 무관하게 항상 한 줄 높이를 유지한다. */}
        <div className="mt-1.5 flex h-5 gap-1 overflow-hidden">
          {conditionTags.map((tag) => (
            <span
              key={tag}
              className="shrink-0 truncate rounded-full border border-line-strong bg-surface px-1.5 py-0.5 text-[9px] font-medium text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
