"use client";

import { useEffect, type ReactNode } from "react";
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
  // 열려 있을 때만 ESC로 닫는다.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <div
      // 닫힌 모달의 버튼이 탭 순서에 남아 보이지 않는 "로그아웃" 같은 걸 키보드로 누를 수 있었다 —
      // pointer-events-none은 마우스만 막으므로 invisible(visibility: hidden)로 포커스까지 뺀다.
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/45 transition-[opacity,visibility]",
        open ? "opacity-100" : "invisible pointer-events-none opacity-0"
      )}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
