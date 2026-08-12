"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[80] bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[81] max-h-[84%] overflow-y-auto rounded-t-2xl bg-card px-4 pb-6 pt-3 transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-line-strong" />
        {title ? <div className="mb-3 text-[15px] font-bold text-ink">{title}</div> : null}
        {children}
      </div>
    </>
  );
}
