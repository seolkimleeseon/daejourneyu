"use client";

import type { Course } from "@/types";
import { Tag } from "@/components/ui/Tag";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { nightsLabel, resolveCourseEmoji, SOURCE_LABEL, SOURCE_TONE } from "@/lib/courseFormat";
import type { CourseSource } from "@/types";

interface CourseCardProps {
  course: Course;
  /** 이 코스에 등록된 일정 개수 — 0이면 "일정 추가하기", 1개 이상이면 몇 개인지 보여준다.
   * 같은 코스를 여러 날짜에 등록할 수 있어(불리언이 아니라 개수) 이미 일정이 있어도 계속 추가할 수 있다. */
  scheduleCount?: number;
  onClick: () => void;
  /** "일정 추가하기" 줄만 따로 눌렀을 때 — 카드 클릭(상세 이동)과 분리해 바로 일정 등록 화면으로 보낸다. */
  onAddSchedule: () => void;
}

const GLOW_CLASS: Record<CourseSource, string> = {
  ai: "bg-accent-purple",
  manual: "bg-brand-300",
  saved: "bg-accent-coral",
};

/** 코스 보관함의 티켓 카드. 흰 바탕 위주로 절제하고, 출처(ai/manual/saved)는 오른쪽 컬러 배지로 표시한다. */
export function CourseCard({ course, scheduleCount = 0, onClick, onAddSchedule }: CourseCardProps) {
  const stopCount = course.days.reduce((sum, day) => sum + day.length, 0);
  const emoji = resolveCourseEmoji(course.emoji, course.source);

  return (
    <div
      onClick={onClick}
      className="mb-3.5 flex w-full cursor-pointer items-stretch overflow-hidden rounded-2xl border border-line bg-card shadow-sm active:bg-surface"
    >
      <div className="flex w-[72px] shrink-0 items-center justify-center border-r border-dashed border-line bg-surface">
        <Emoji3D emoji={emoji} size={44} glowClassName={GLOW_CLASS[course.source]} />
      </div>

      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 truncate text-[15px] font-bold text-ink">{course.label}</div>
          <Tag tone={SOURCE_TONE[course.source]} className="shrink-0 cursor-default">
            {SOURCE_LABEL[course.source]}
          </Tag>
        </div>
        <div className="mt-1.5 text-xs text-ink-muted">
          {nightsLabel(course.nights)} · {stopCount}곳{course.shared ? " · 공유됨" : ""}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddSchedule();
          }}
          className="mt-2 text-xs font-semibold text-brand"
        >
          {scheduleCount > 0 ? `📅 등록된 일정 ${scheduleCount}개 · 추가하기 ›` : "📅 일정 추가하기 ›"}
        </button>
      </div>
    </div>
  );
}
