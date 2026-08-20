"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightSlot?: ReactNode;
  /** 기본값은 router.back() — 위저드처럼 뒤로가기가 내부 스텝을 되돌려야 하는 화면에서 오버라이드 */
  onBack?: () => void;
}

/** 각 페이지가 자신의 콘텐츠 맨 위에 직접 렌더링한다 (sticky top-0). AppShell은 BottomNav만 담당. */
export function TopBar({ title, showBack, rightSlot, onBack }: TopBarProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-10 flex h-11 shrink-0 items-center justify-between border-b border-line bg-surface px-3.5">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        className={showBack ? "min-w-9 text-xs text-ink-muted" : "invisible min-w-9 text-xs"}
      >
        ‹ 뒤로
      </button>
      <span className="text-sm font-bold text-ink">{title}</span>
      <span className="flex min-w-9 justify-end text-xs text-brand">{rightSlot}</span>
    </div>
  );
}
