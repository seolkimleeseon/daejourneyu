"use client";

import { cn } from "@/lib/cn";

interface FeedPagerProps {
  /** 현재 페이지(0-base) */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * 목록 아래 페이지 번호 줄.
 *
 * 둘러보기 본문은 무한 스크롤이지만(InfiniteScrollSentinel), 내 글·내 후기처럼 **내가 쓴 것을
 * 관리하는 목록**은 페이지로 끊는다 — 지운 뒤 같은 자리로 돌아와야 하는데 무한 스크롤은
 * 그 위치를 다시 잡아주지 못한다.
 */
export function FeedPager({ page, totalPages, onChange }: FeedPagerProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1.5 py-3">
      <PagerArrow label="이전 페이지" disabled={0 === page} onClick={() => onChange(page - 1)}>
        ‹
      </PagerArrow>

      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`${index + 1}페이지`}
          aria-current={index === page ? "page" : undefined}
          onClick={() => onChange(index)}
          className={cn(
            "h-7 min-w-7 rounded-full px-2 text-xs font-semibold transition-colors",
            index === page ? "bg-brand text-white" : "bg-surface text-ink-muted"
          )}
        >
          {index + 1}
        </button>
      ))}

      <PagerArrow
        label="다음 페이지"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        ›
      </PagerArrow>
    </nav>
  );
}

function PagerArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full bg-surface text-xs font-semibold text-ink-muted transition-colors disabled:opacity-35"
    >
      {children}
    </button>
  );
}
