"use client";

import { cn } from "@/lib/cn";

interface SameTypeFilterProps {
  active: boolean;
  /** 기준이 되는 반려동물 성향 유형명. 등록된 반려동물이 없으면 일반 문구로 대체된다. */
  petTypeName: string | null;
  onToggle: () => void;
}

/**
 * '우리 아이와 같은 유형 코스만 보기' 토글. 검색 중에는 노출하지 않는다(검색은 항상 전체 대상).
 *
 * 유형을 가진 건 **반려동물**이지 보호자가 아니다(루트 CLAUDE.md 도메인 용어).
 * 예전 문구 "같은 OOO 보호자 코스만 보기"는 유형을 사람에게 붙여 읽혀서 바꿨다.
 *
 * 기준이 될 유형이 없으면(반려동물 미등록·MBTI 미검사) 누를 수 없게 막는다 —
 * 필터가 걸릴 수 없는 상태라, 눌리기만 하고 아무 일도 안 일어나는 게 제일 나쁘다.
 */
export function SameTypeFilter({ active, petTypeName, onToggle }: SameTypeFilterProps) {
  const usable = petTypeName !== null;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!usable}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl px-3.5 py-2.5 text-left text-[11px] transition-colors",
        !usable
          ? "bg-surface text-ink-muted opacity-60"
          : active
            ? "bg-accent-purple-light font-semibold text-accent-purple"
            : "bg-surface text-ink-muted"
      )}
    >
      <span aria-hidden>{usable ? (active ? "✓" : "○") : "🐾"}</span>
      {usable
        ? `우리 아이와 같은 유형 · ${petTypeName} 코스만 보기`
        : "MBTI를 검사하면 같은 유형 코스만 모아볼 수 있어요"}
    </button>
  );
}
