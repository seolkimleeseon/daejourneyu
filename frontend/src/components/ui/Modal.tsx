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
}

export function Modal({ open, onClose, emoji, title, description, children }: ModalProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 transition-opacity",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className="w-[260px] rounded-xl bg-card p-6 text-center shadow-xl"
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
