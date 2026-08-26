"use client";

import { cn } from "@/lib/cn";

interface SameTypeFilterProps {
  active: boolean;
  /** 기준이 되는 반려동물 성향 유형명. 등록된 반려동물이 없으면 일반 문구로 대체된다. */
  petTypeName: string | null;
  onToggle: () => void;
}

/** '같은 유형 보호자 코스만 보기' 토글. 검색 중에는 노출하지 않는다(검색은 항상 전체 대상). */
export function SameTypeFilter({ active, petTypeName, onToggle }: SameTypeFilterProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[11px] transition-colors",
        active ? "bg-accent-purple-light font-semibold text-accent-purple" : "bg-surface text-ink-muted"
      )}
    >
      <span aria-hidden>{active ? "✓" : "○"}</span>
      {petTypeName ? `같은 ${petTypeName} 보호자 코스만 보기` : "나와 같은 유형 보호자 코스만 보기"}
    </button>
  );
}
