"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

interface HomeFeatureCardProps {
  emoji: string;
  eyebrow: string;
  titleLines: [string, string];
  subtitle?: string;
  ctaLabel: string;
  gradientClass: string;
  onClick: () => void;
  /** 카드 오른쪽에 꽉 채워 보여줄 배경 일러스트. 왼쪽 텍스트 영역은 비워두고(투명) 그린
   * 이미지를 쓴다 — 그 투명 영역 아래로 gradientClass 배경이 그대로 비쳐 보인다. */
  backgroundImageSrc?: string;
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
  backgroundImageSrc,
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
      {backgroundImageSrc ? (
        <Image
          src={backgroundImageSrc}
          alt=""
          fill
          sizes="400px"
          className="object-cover object-right"
        />
      ) : null}

      {emoji ? (
        <span className="absolute right-5 top-5 z-10 text-2xl opacity-90">{emoji}</span>
      ) : null}
      <span className="relative font-mono text-[9px] font-bold uppercase tracking-widest text-white/70">
        {eyebrow}
      </span>
      <div className="relative mt-1.5 max-w-[70%] text-xl font-extrabold leading-tight text-white">
        {titleLines[0]}
        <br />
        {titleLines[1]}
      </div>
      {subtitle ? (
        <div className="relative mt-1.5 max-w-[75%] text-[11px] text-white/80">{subtitle}</div>
      ) : null}
      <span className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white">
        {ctaLabel} →
      </span>
    </button>
  );
}
