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
        <div className="absolute bottom-0 right-0 h-[125%] w-[125%]">
          <Image
            src={backgroundImageSrc}
            alt=""
            fill
            sizes="500px"
            quality={90}
            className="object-cover object-right"
          />
        </div>
      ) : null}

      {emoji ? (
        <span className="absolute right-5 top-5 z-10 text-2xl opacity-90">{emoji}</span>
      ) : null}
      <span className="relative font-mono text-[9px] font-bold uppercase tracking-widest text-brand-700">
        {eyebrow}
      </span>
      <div className="relative mt-1.5 max-w-[70%] text-xl font-extrabold leading-tight text-ink">
        {titleLines[0]}
        <br />
        {titleLines[1]}
      </div>
      {subtitle ? (
        <div className="relative mt-1.5 max-w-[55%] break-keep text-[11px] text-ink-muted">
          {subtitle}
        </div>
      ) : null}
      <span className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1.5 text-[11px] font-bold text-brand-700">
        {ctaLabel} →
      </span>
    </button>
  );
}
