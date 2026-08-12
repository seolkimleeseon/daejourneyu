"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TagTone = "brand" | "purple" | "amber" | "coral" | "neutral";

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
};

export function Tag({ tone = "neutral", active, className, children, ...rest }: TagProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        toneClasses[tone],
        active && "bg-brand text-white",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
