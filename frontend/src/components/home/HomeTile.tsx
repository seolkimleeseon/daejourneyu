"use client";

import { cn } from "@/lib/cn";

interface HomeTileProps {
  emoji: string;
  title: string;
  subtitle: string;
  tone: "brand" | "purple" | "amber" | "coral";
  onClick: () => void;
}

const TONE_CLASS: Record<HomeTileProps["tone"], string> = {
  brand: "bg-brand text-white",
  purple: "bg-accent-purple text-white",
  amber: "bg-accent-amber text-white",
  coral: "bg-accent-coral text-white",
};

export function HomeTile({ emoji, title, subtitle, tone, onClick }: HomeTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[116px] flex-col rounded-xl border border-line bg-card p-3.5 text-left shadow-sm active:scale-[.98]"
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-xl", TONE_CLASS[tone])}>
        {emoji}
      </span>
      <div className="mt-3 text-[13px] font-extrabold tracking-tight text-ink">{title}</div>
      <div className="mt-0.5 text-[11px] leading-snug text-ink-muted">{subtitle}</div>
    </button>
  );
}
