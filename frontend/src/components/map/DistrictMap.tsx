"use client";

import type { DaejeonDistrict } from "@/types";
import { cn } from "@/lib/cn";

interface DistrictMapProps {
  onSelect: (district: DaejeonDistrict) => void;
}

const REGIONS: Array<{ district: DaejeonDistrict; emoji: string; area: string; tone: string }> = [
  { district: "유성구", emoji: "♨️", area: "yuseong", tone: "bg-brand" },
  { district: "대덕구", emoji: "⛰️", area: "daedeok", tone: "bg-accent-purple" },
  { district: "서구", emoji: "🌲", area: "seo", tone: "bg-accent-navy" },
  { district: "중구", emoji: "🏛️", area: "jung", tone: "bg-accent-amber" },
  { district: "동구", emoji: "🌳", area: "dong", tone: "bg-accent-coral" },
];

/**
 * 실좌표 지도가 아니라, 대전 5개 구의 상대적 위치(유성·대덕은 북쪽, 서/중/동구는 남쪽 띠)를
 * grid-template-areas로 본뜬 일러스트형 지도. 구 이름 버튼 그리드 대신 지도 모양으로 보이게 한다.
 */
export function DistrictMap({ onSelect }: DistrictMapProps) {
  return (
    <div
      className="grid aspect-[4/3] w-full gap-1.5"
      style={{
        gridTemplateAreas:
          '"yuseong yuseong daedeok daedeok" "yuseong yuseong daedeok daedeok" "seo jung dong dong"',
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
      }}
    >
      {REGIONS.map((region) => (
        <button
          key={region.district}
          type="button"
          onClick={() => onSelect(region.district)}
          style={{ gridArea: region.area }}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-2xl text-white transition-transform active:scale-95",
            region.tone
          )}
        >
          <span className="text-2xl">{region.emoji}</span>
          <span className="text-xs font-bold">{region.district}</span>
        </button>
      ))}
    </div>
  );
}
