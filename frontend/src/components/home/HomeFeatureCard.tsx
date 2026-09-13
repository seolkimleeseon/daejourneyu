"use client";

import { cn } from "@/lib/cn";

interface HomeFeatureCardProps {
  emoji: string;
  eyebrow: string;
  titleLines: [string, string];
  subtitle?: string;
  ctaLabel: string;
  gradientClass: string;
  onClick: () => void;
}

/** 홈 하단 "축제 캘린더" 진입에 쓰는 큰 피처 카드 — 작은 정사각 타일(HomeTile)보다 한 체급 큰 강조 카드. */
export function HomeFeatureCard({
  emoji,
  eyebrow,
  titleLines,
  subtitle,
  ctaLabel,
  gradientClass,
  onClick,
}: HomeFeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl px-5 py-5 text-left shadow-sm active:scale-[.99]",
        gradientClass
      )}
    >
      <span className="absolute right-5 top-5 text-2xl opacity-90">{emoji}</span>
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/70">
        {eyebrow}
      </span>
      <div className="mt-1.5 max-w-[70%] text-xl font-extrabold leading-tight text-white">
        {titleLines[0]}
        <br />
        {titleLines[1]}
      </div>
      {subtitle ? <div className="mt-1.5 text-[11px] text-white/80">{subtitle}</div> : null}
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white">
        {ctaLabel} →
      </span>
    </button>
  );
}
