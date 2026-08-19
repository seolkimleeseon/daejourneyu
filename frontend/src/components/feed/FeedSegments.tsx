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

/** 프로토타입 renderBrowseMerged의 3분할 세그먼트. 라우트를 나누지 않고 내부 state로만 전환한다. */
export function FeedSegments({ value, onChange }: FeedSegmentsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-surface p-1">
      {SEGMENTS.map((segment) => (
        <button
          key={segment.key}
          type="button"
          onClick={() => onChange(segment.key)}
          className={cn(
            "flex-1 rounded-md py-2 text-xs font-bold transition-colors",
            value === segment.key ? "bg-card text-brand-700 shadow-sm" : "text-ink-muted"
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}
