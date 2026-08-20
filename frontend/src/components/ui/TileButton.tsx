"use client";

import { cn } from "@/lib/cn";

export type TileButtonTone = "brand" | "purple" | "amber" | "coral";

interface TileButtonProps {
  /** outlined: 카드에 테두리 + 아이콘만 tone 색상(홈 2열). filled: 카드 전체가 tone 색상(내 여정 3열) */
  variant: "outlined" | "filled";
  tone: TileButtonTone;
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const ICON_TONE_CLASS: Record<TileButtonTone, string> = {
  brand: "bg-brand text-white",
  purple: "bg-accent-purple text-white",
  amber: "bg-accent-amber text-white",
  coral: "bg-accent-coral text-white",
};

const FILLED_TONE_CLASS: Record<TileButtonTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  purple: "bg-accent-purple-light text-accent-purple",
  amber: "bg-accent-amber-light text-accent-amber",
  coral: "bg-accent-coral-light text-accent-coral",
};

/** 이모지 아이콘 + 제목 + 부제 클릭 타일. 홈의 outlined 스킨과 내 여정의 filled 스킨을 공용으로 묶었다. */
export function TileButton({ variant, tone, emoji, title, subtitle, onClick }: TileButtonProps) {
  if (variant === "filled") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center transition-transform active:scale-[0.97]",
          FILLED_TONE_CLASS[tone]
        )}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-xl">{emoji}</span>
        <span>
          <div className="text-xs font-bold leading-tight">{title}</div>
          <div className="mt-1 text-[10px] font-normal leading-snug opacity-80">{subtitle}</div>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[116px] flex-col rounded-xl border border-line bg-card p-3.5 text-left shadow-sm active:scale-[.98]"
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-xl", ICON_TONE_CLASS[tone])}>
        {emoji}
      </span>
      <div className="mt-3 text-[13px] font-extrabold tracking-tight text-ink">{title}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-ink-muted">{subtitle}</div>
    </button>
  );
}
