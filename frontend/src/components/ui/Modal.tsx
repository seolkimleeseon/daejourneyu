"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  emoji?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  /** 다이얼로그 폭. 기본값(w-[260px])보다 넓게 쓰고 싶을 때만 지정한다. */
  widthClass?: string;
}

export function Modal({
  open,
  onClose,
  emoji,
  title,
  description,
  children,
  widthClass = "w-[260px]",
}: ModalProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 transition-opacity",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className={cn("rounded-xl bg-card p-6 text-center shadow-xl", widthClass)}
        onClick={(event) => event.stopPropagation()}
      >
        {emoji ? <div className="mb-2.5 text-3xl">{emoji}</div> : null}
        <div className="mb-1.5 text-sm font-bold text-ink">{title}</div>
        {description ? (
          <div className="mb-4 text-xs leading-relaxed text-ink-muted">{description}</div>
        ) : null}
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
