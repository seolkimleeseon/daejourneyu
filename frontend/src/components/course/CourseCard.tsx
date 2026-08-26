"use client";

import type { Course } from "@/types";
import { Tag } from "@/components/ui/Tag";
import { nightsLabel, resolveCourseEmoji, SOURCE_LABEL, SOURCE_TONE } from "@/lib/courseFormat";

interface CourseCardProps {
  course: Course;
  /** 이 코스에 예정된 일정이 있으면 캘린더 안내 문구를 보여준다. */
  hasUpcomingSchedule?: boolean;
  onClick: () => void;
}

/** 코스 보관함의 티켓 카드. 흰 바탕 위주로 절제하고, 출처(ai/manual/saved)는 오른쪽 컬러 배지로 표시한다. */
export function CourseCard({ course, hasUpcomingSchedule, onClick }: CourseCardProps) {
  const stopCount = course.days.reduce((sum, day) => sum + day.length, 0);
  const emoji = resolveCourseEmoji(course.emoji, course.source);

  return (
    <div
      onClick={onClick}
      className="mb-2.5 flex w-full cursor-pointer items-stretch overflow-hidden rounded-2xl border border-line bg-card shadow-sm active:bg-surface"
    >
      <div className="flex w-[68px] shrink-0 items-center justify-center border-r border-dashed border-line bg-surface text-3xl">
        {emoji}
      </div>

      <div className="min-w-0 flex-1 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 truncate text-[15px] font-bold text-ink">{course.label}</div>
          <Tag tone={SOURCE_TONE[course.source]} className="shrink-0 cursor-default">
            {SOURCE_LABEL[course.source]}
          </Tag>
        </div>
        <div className="mt-1 text-xs text-ink-muted">
          {nightsLabel(course.nights)} · {stopCount}곳{course.shared ? " · 공유됨" : ""}
        </div>
        <div className="mt-1.5 text-xs font-semibold text-brand">
          {hasUpcomingSchedule ? "📅 예정된 일정 있어요" : "📅 일정을 추가하기 ›"}
        </div>
      </div>
    </div>
  );
}
