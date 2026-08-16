"use client";

import { useRouter } from "next/navigation";
import type { Place } from "@/types";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";

interface PlaceCardProps {
  place: Place;
}

export function PlaceCard({ place }: PlaceCardProps) {
  const router = useRouter();

  return (
    <Card onClick={() => router.push(`/place/${encodeURIComponent(place.name)}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink">{place.name}</div>
          <div className="mt-0.5 text-[11px] text-ink-muted">
            {place.district} · {place.category}
          </div>
        </div>
        <Tag
          tone={place.petFriendly ? "brand" : "neutral"}
          className="shrink-0 cursor-default px-2 py-1 text-[10px]"
        >
          {place.petFriendly ? "동반 가능" : "동반 불가"}
        </Tag>
      </div>
      <div className="mt-2 text-xs text-ink-muted">{place.condition}</div>
    </Card>
  );
}
