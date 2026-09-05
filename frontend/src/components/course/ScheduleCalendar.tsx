"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { nightsLabel } from "@/lib/courseFormat";
import { useCourseStore } from "@/stores/useCourseStore";
import type { CourseSource } from "@/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYmd(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

/**
 * 내 여정(SCHEDULE) 탭의 '캘린더' 세그. 홈의 축제 캘린더(app/(shell)/home/festival)와 달 그리드
 * 구조는 동일하지만, 표시 대상이 축제가 아니라 내가 코스에 등록한 일정(CourseSchedule)이다.
 */
export function ScheduleCalendar() {
  const router = useRouter();
  const courses = useCourseStore((state) => state.courses);
  const schedules = useCourseStore((state) => state.schedules);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toYmd(today.getFullYear(), today.getMonth(), today.getDate()));

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month0, 1).getDay();
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    const list: Array<{ day: number; date: string } | null> = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) list.push({ day, date: toYmd(year, month0, day) });
    return list;
  }, [year, month0]);

  const changeMonth = (delta: number) => {
    let nextMonth = month0 + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonth0(nextMonth);
    setYear(nextYear);
  };

  const todayYmd = toYmd(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedDate);

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} className="px-2 text-sm text-ink-muted">
          ‹
        </button>
        <span className="text-sm font-bold text-ink">
          {year}년 {month0 + 1}월
        </span>
        <button type="button" onClick={() => changeMonth(1)} className="px-2 text-sm text-ink-muted">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-center text-[9px] text-ink-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} />;
          const hasSchedule = schedules.some((schedule) => schedule.date === cell.date);
          const isToday = cell.date === todayYmd;
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border border-line pt-1 text-[10px] text-ink",
                isSelected && "border-brand-400 bg-brand-100",
                isToday && !isSelected && "border-brand"
              )}
            >
              <span>{cell.day}</span>
              {hasSchedule ? <span className="h-1 w-1 rounded-full bg-brand" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" /> 예정된 일정
      </div>

      <div className="mb-1 mt-5 px-1 text-xs font-bold text-ink-muted">{selectedDate} 일정</div>
      {selectedSchedules.length === 0 ? (
        <div className="py-8 text-center text-xs text-ink-muted">이 날엔 등록된 일정이 없어요.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {selectedSchedules.map((schedule) => {
            const course = courses.find((item) => item.id === schedule.courseId);
            if (!course) return null;
            const stopCount = course.days.reduce((sum, day) => sum + day.length, 0);
            return (
              <Card
                key={schedule.id}
                onClick={() => router.push(`/schedule/course/${course.id}`)}
                className="rounded-2xl px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-ink">{course.label}</span>
                  <Tag tone={SOURCE_TONE[course.source]} className="shrink-0 cursor-default">
                    {SOURCE_LABEL[course.source]}
                  </Tag>
                </div>
                <div className="mt-1 text-xs text-ink-muted">
                  {nightsLabel(course.nights)} · {stopCount}곳
                </div>
                {schedule.festivalTitles.length > 0 ? (
                  <div className="mt-1.5 text-[11px] text-ink-muted">
                    🎪 근처 축제: {schedule.festivalTitles.join(", ")}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
