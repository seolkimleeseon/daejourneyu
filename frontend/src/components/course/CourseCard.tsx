"use client";

import type { Course, CourseSource } from "@/types";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { nightsLabel } from "@/lib/courseFormat";

const SOURCE_LABEL: Record<CourseSource, string> = {
  ai: "AI 추천",
  manual: "직접",
  saved: "내가 담은 코스",
};

const SOURCE_TONE: Record<CourseSource, "purple" | "brand" | "coral"> = {
  ai: "purple",
  manual: "brand",
  saved: "coral",
};

interface CourseCardProps {
  course: Course;
  /** 이 코스에 예정된 일정이 있으면 캘린더 안내 문구를 보여준다. */
  hasUpcomingSchedule?: boolean;
  onClick: () => void;
}

export function CourseCard({ course, hasUpcomingSchedule, onClick }: CourseCardProps) {
  const stopCount = course.days.reduce((sum, day) => sum + day.length, 0);

  return (
    <Card onClick={onClick} className="mb-2 rounded-2xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold text-ink">{course.label}</div>
        <Tag tone={SOURCE_TONE[course.source]} className="shrink-0 cursor-default">
          {SOURCE_LABEL[course.source]}
        </Tag>
      </div>
      <div className="mt-1 text-xs text-ink-muted">
        {nightsLabel(course.nights)} · {stopCount}곳{course.shared ? " · 공유됨" : ""}
      </div>
      {hasUpcomingSchedule ? (
        <div className="mt-2 border-t border-dashed border-brand-300 pt-2 text-xs font-semibold text-brand-700">
          📅 예정된 일정 있어요 · 캘린더에서 확인
        </div>
      ) : (
        <div className="mt-2 text-xs font-semibold text-brand">📅 일정을 추가하기 ›</div>
      )}
    </Card>
  );
}
