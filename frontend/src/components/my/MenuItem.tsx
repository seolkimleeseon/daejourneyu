"use client";

import type { ReactNode } from "react";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { cn } from "@/lib/cn";

interface MenuItemProps {
  label: string;
  /** 줄 왼쪽 3D 아이콘. 넘기지 않으면 라벨만 나온다 — 아이콘 없는 줄과 섞여도 깨지지 않는다. */
  icon?: string;
  trailing?: ReactNode;
  tone?: "default" | "danger" | "brand";
  onClick: () => void;
}

const toneClasses = {
  default: "text-ink",
  danger: "text-accent-coral",
  brand: "text-brand-700",
};

export function MenuItem({ label, icon, trailing, tone = "default", onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[54px] w-full items-center justify-between border-b border-line px-0.5 text-left text-sm active:bg-surface"
    >
      <span className={cn("flex items-center gap-2.5", toneClasses[tone])}>
        {icon ? <Emoji3D emoji={icon} size={20} shadow={false} /> : null}
        {label}
      </span>
      <span className="text-[9px] text-ink-muted">{trailing}</span>
    </button>
  );
}
