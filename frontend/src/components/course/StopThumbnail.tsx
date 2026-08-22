"use client";

import { useState } from "react";
import { CATEGORY_EMOJI, CATEGORY_TONE } from "@/lib/courseFormat";
import { cn } from "@/lib/cn";
import type { PlaceCategory } from "@/types";

interface StopThumbnailProps {
  category: PlaceCategory;
  imageUrl?: string | null;
  /** 동선 순번 뱃지(오른쪽 아래). 생략하면 표시하지 않는다. */
  badge?: number;
  size?: number;
  className?: string;
}

/** 동선 리스트의 장소 대표 이미지 — 사진이 있으면 사진, 없으면 카테고리별 색상 원에 이모지로 대체한다. */
export function StopThumbnail({ category, imageUrl, badge, size = 52, className }: StopThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const tone = CATEGORY_TONE[category];
  const showImage = !!imageUrl && !imageFailed;

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-xl", className)} style={{ width: size, height: size }}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl ?? undefined}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center text-xl", tone.bg)}>
          {CATEGORY_EMOJI[category] ?? "📍"}
        </div>
      )}
      {badge != null ? (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-brand text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
