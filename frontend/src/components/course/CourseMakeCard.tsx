"use client";

import { cn } from "@/lib/cn";

type CourseMakeTone = "brand" | "purple" | "coral";

interface CourseMakeCardProps {
  tone: CourseMakeTone;
  emoji: string;
  title: string;
  sub: string;
  onClick: () => void;
}

const toneClasses: Record<CourseMakeTone, string> = {
  brand: "bg-brand-100 text-brand-700",
  purple: "bg-accent-purple-light text-accent-purple",
  coral: "bg-accent-coral-light text-accent-coral",
};

/** 코스 만들기 진입 카드 3종(MBTI·AI 챗봇·직접 짓기) — 가로 3열 배치. */
export function CourseMakeCard({ tone, emoji, title, sub, onClick }: CourseMakeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center transition-transform active:scale-[0.97]",
        toneClasses[tone]
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-card text-xl">{emoji}</span>
      <span>
        <div className="text-xs font-bold leading-tight">{title}</div>
        <div className="mt-1 text-[10px] font-normal leading-snug opacity-80">{sub}</div>
      </span>
    </button>
  );
}
