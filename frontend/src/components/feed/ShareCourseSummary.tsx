"use client";

import type { Course } from "@/types";
import { Tag } from "@/components/ui/Tag";
import { nightsLabel, resolveCourseEmoji, SOURCE_LABEL, SOURCE_TONE } from "@/lib/courseFormat";

interface ShareCourseSummaryProps {
  course: Course;
}

/**
 * 자랑하기 화면 상단에서 '지금 올리려는 코스'를 확인시켜 주는 카드.
 * 코스는 이미 앞 화면(코스 상세)에서 고르고 들어오므로 여기서 다시 고르게 하지 않는다 — 확인만 시킨다.
 */
export function ShareCourseSummary({ course }: ShareCourseSummaryProps) {
  const stopCount = course.days.reduce((sum, day) => sum + day.length, 0);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-brand-300 bg-brand-100/60 px-3.5 py-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card text-2xl">
        {resolveCourseEmoji(course.emoji, course.source)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-ink">{course.label}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          {nightsLabel(course.nights)} · {course.transport} · 장소 {stopCount}곳
        </div>
      </div>

      <Tag tone={SOURCE_TONE[course.source]} className="shrink-0 cursor-default">
        {SOURCE_LABEL[course.source]}
      </Tag>
    </div>
  );
}
