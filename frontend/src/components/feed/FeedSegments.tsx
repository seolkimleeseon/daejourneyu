"use client";

import { cn } from "@/lib/cn";

export type FeedSegment = "course" | "article" | "mine";

const SEGMENTS: { key: FeedSegment; label: string }[] = [
  { key: "course", label: "코스" },
  { key: "article", label: "아티클" },
  { key: "mine", label: "내 글" },
];

interface FeedSegmentsProps {
  value: FeedSegment;
  onChange: (value: FeedSegment) => void;
}

/** 프로토타입 renderBrowseMerged의 3분할 칩 탭. 라우트를 나누지 않고 내부 state로만 전환한다. */
export function FeedSegments({ value, onChange }: FeedSegmentsProps) {
  return (
    <div className="flex gap-1.5">
      {SEGMENTS.map((segment) => (
        <button
          key={segment.key}
          type="button"
          onClick={() => onChange(segment.key)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors",
            value === segment.key
              ? "border-brand-500 bg-brand-500 text-white shadow-sm"
              : "border-line-strong bg-card text-ink-muted"
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
