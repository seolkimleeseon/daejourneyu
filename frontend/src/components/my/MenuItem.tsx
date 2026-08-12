"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface MenuItemProps {
  label: string;
  trailing?: ReactNode;
  tone?: "default" | "danger" | "brand";
  onClick: () => void;
}

const toneClasses = {
  default: "text-ink",
  danger: "text-accent-coral",
  brand: "text-brand-700",
};

export function MenuItem({ label, trailing, tone = "default", onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center justify-between border-b border-line px-0.5 text-left text-sm active:bg-surface"
    >
      <span className={cn(toneClasses[tone])}>{label}</span>
      <span className="text-[9px] text-ink-muted">{trailing}</span>
    </button>
  );
}
