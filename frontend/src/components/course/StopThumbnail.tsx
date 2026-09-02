"use client";

import { useState } from "react";
import { CATEGORY_EMOJI, CATEGORY_TONE } from "@/lib/courseFormat";
import { Emoji3D } from "@/components/ui/Emoji3D";
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
    // 뱃지(순번)를 이 바깥 relative 컨테이너 기준으로 띄워서, 이미지 쪽에만 overflow-hidden을 걸어
    // 뱃지가 모서리에서 잘리지 않게 한다 — 예전엔 컨테이너 자체가 overflow-hidden이라 -bottom-1/-right-1로
    // 살짝 밖으로 나간 뱃지 테두리가 잘려 보였다.
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div className="h-full w-full overflow-hidden rounded-xl">
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
          <div className={cn("flex h-full w-full items-center justify-center", tone.bg)}>
            <Emoji3D emoji={CATEGORY_EMOJI[category] ?? "📍"} size={Math.round(size * 0.6)} />
          </div>
        )}
      </div>
      {badge != null ? (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-brand text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
