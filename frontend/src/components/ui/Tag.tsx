"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TagTone = "brand" | "purple" | "amber" | "coral" | "neutral" | "neutral-ghost";

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: TagTone;
  /** 선택된 상태(칩) — 프로토타입 .chip.on / .fchip.active 대응 */
  active?: boolean;
}

const toneClasses: Record<TagTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  purple: "bg-accent-purple-light text-accent-purple",
  amber: "bg-accent-amber-light text-accent-amber",
  coral: "bg-accent-coral-light text-accent-coral",
  neutral: "bg-surface text-ink-muted border border-line-strong",
  /** neutral과 달리 테두리가 없는 필터 칩용(예: 장소 선택 바텀시트 카테고리/지역 필터) */
  "neutral-ghost": "bg-surface text-ink-muted",
};

export function Tag({ tone = "neutral", active, className, children, ...rest }: TagProps) {
  const classes = cn(
    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
    toneClasses[tone],
    active && "bg-brand text-white",
    className
  );

  // 누를 곳이 없는 태그(출처 배지·조건 표시)를 버튼으로 그리면 키보드 포커스만 먹고 아무 일도 안 한다.
  // onClick이 없으면 모양만 같은 span으로 그려 탭 순서에서 뺀다.
  if (!rest.onClick) {
    return <span className={cn("inline-block", classes)}>{children}</span>;
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
