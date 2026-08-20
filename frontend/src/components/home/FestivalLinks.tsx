"use client";

import type { FestivalEvent } from "@/types";
import { cn } from "@/lib/cn";

interface FestivalLinksProps {
  festival: Pick<FestivalEvent, "webUrl" | "instagramUrl">;
  className?: string;
}

/**
 * 축제 카드의 외부 링크(인스타그램/블로그·홈페이지) 아이콘 버튼.
 * 브리핑·축제 캘린더에서 공용으로 쓴다. 카드 자체가 클릭 가능한 경우(장소 이동)와 겹치지
 * 않도록 클릭 전파를 막는다.
 */
export function FestivalLinks({ festival, className }: FestivalLinksProps) {
  if (!festival.instagramUrl && !festival.webUrl) return null;

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)} onClick={(e) => e.stopPropagation()}>
      {festival.instagramUrl ? (
        <a
          href={festival.instagramUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="인스타그램에서 보기"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-[11px] text-ink-muted"
        >
          📷
        </a>
      ) : null}
      {festival.webUrl ? (
        <a
          href={festival.webUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="블로그·홈페이지에서 보기"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-[11px] text-ink-muted"
        >
          🔗
        </a>
      ) : null}
    </div>
  );
}
