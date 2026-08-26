"use client";

interface FeedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** 코스 탭 전용 장소 검색바. 입력 즉시 목록을 좁힌다(프로토타입 jyUpdateFeedList와 동일). */
export function FeedSearchBar({ value, onChange }: FeedSearchBarProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="🔍 장소로 코스 검색 (예: 한빛탑)"
      aria-label="장소로 코스 검색"
      className="w-full rounded-xl border border-line-strong bg-card px-3.5 py-2.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-brand-500"
    />
  );
}
