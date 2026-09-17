"use client";

import type { ReactNode } from "react";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  emoji?: string;
  /** 위 emoji를 3D 렌더 아이콘으로 보여줄지. TabPlaceholder·TileButton과 같은 opt-in 패턴이라
   * 지정하지 않은 기존 호출부는 평면 이모지 그대로다. */
  icon3D?: boolean;
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
  icon3D = false,
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
        {emoji ? (
          <div className="mb-2.5 flex justify-center">
            {icon3D ? <Emoji3D emoji={emoji} size={44} /> : <span className="text-3xl">{emoji}</span>}
          </div>
        ) : null}
        <div className="mb-1.5 text-sm font-bold text-ink">{title}</div>
        {description ? (
          <div className="mb-4 text-xs leading-relaxed text-ink-muted">{description}</div>
        ) : null}
        <div className="flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
