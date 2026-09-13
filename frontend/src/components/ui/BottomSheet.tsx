"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 스크롤과 무관하게 시트 맨 아래에 항상 고정되는 영역(예: 완료 버튼) */
  footer?: ReactNode;
  children?: ReactNode;
}

export function BottomSheet({ open, onClose, title, footer, children }: BottomSheetProps) {
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
          "fixed inset-x-0 bottom-0 z-[81] mx-auto flex w-full max-w-[480px] h-[70vh] max-h-[84%] min-h-[320px] flex-col overflow-hidden rounded-t-2xl bg-card transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="thin-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-3">
          <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-line-strong" />
          {title ? <div className="mb-3 text-[15px] font-bold text-ink">{title}</div> : null}
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-line bg-card px-4 pb-4 pt-3 shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.18)]">
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}
