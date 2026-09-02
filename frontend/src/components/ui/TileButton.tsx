"use client";

import { cn } from "@/lib/cn";
import { Emoji3D } from "./Emoji3D";

export type TileButtonTone = "brand" | "purple" | "amber" | "coral";

interface TileButtonProps {
  /** outlined: 카드에 테두리 + 아이콘만 tone 색상(홈 2열). filled: 카드 전체가 tone 색상(내 여정 3열) */
  variant: "outlined" | "filled";
  tone: TileButtonTone;
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  /** 3D 렌더 아이콘(Emoji3D)을 쓸지 여부. 이 컴포넌트는 홈·내 여정 탭이 같이 쓰는 공용 primitive라
   * 기본값은 기존 평면 이모지 칩으로 두고, 원하는 화면에서만 명시적으로 켠다. */
  icon3D?: boolean;
}

const ICON_TONE_CLASS: Record<TileButtonTone, string> = {
  brand: "bg-brand text-white",
  purple: "bg-accent-purple text-white",
  amber: "bg-accent-amber text-white",
  coral: "bg-accent-coral text-white",
};

/** 3D 아이콘 뒤에 은은하게 번지는 톤별 색 블롭(icon3D일 때만 쓰인다). */
const GLOW_CLASS: Record<TileButtonTone, string> = {
  brand: "bg-brand-300",
  purple: "bg-accent-purple",
  amber: "bg-accent-amber",
  coral: "bg-accent-coral",
};

const FILLED_TONE_CLASS: Record<TileButtonTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  purple: "bg-accent-purple-light text-accent-purple",
  amber: "bg-accent-amber-light text-accent-amber",
  coral: "bg-accent-coral-light text-accent-coral",
};

/** 이모지 아이콘 + 제목 + 부제 클릭 타일. 홈의 outlined 스킨과 내 여정의 filled 스킨을 공용으로 묶었다. */
export function TileButton({ variant, tone, emoji, title, subtitle, onClick, icon3D = false }: TileButtonProps) {
  if (variant === "filled") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl px-2.5 py-5 text-center transition-transform active:scale-[0.97]",
          FILLED_TONE_CLASS[tone]
        )}
      >
        {icon3D ? (
          <Emoji3D emoji={emoji} size={42} />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-xl">{emoji}</span>
        )}
        <span className="flex flex-col gap-1 break-keep">
          <span className="text-xs font-bold leading-tight">{title}</span>
          <span className="text-balance text-[10px] font-normal leading-snug opacity-80">{subtitle}</span>
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
      {icon3D ? (
        <Emoji3D emoji={emoji} size={40} glowClassName={GLOW_CLASS[tone]} className="ml-0" />
      ) : (
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-xl", ICON_TONE_CLASS[tone])}>
          {emoji}
        </span>
      )}
      <div className="mt-2.5 break-keep text-[13px] font-extrabold tracking-tight text-ink">{title}</div>
      <div className="mt-0.5 break-keep text-[11px] leading-snug text-ink-muted">{subtitle}</div>
    </button>
  );
}
