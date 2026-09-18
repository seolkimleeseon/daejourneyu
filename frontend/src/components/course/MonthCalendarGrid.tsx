"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYmd(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

/** YYYY-MM-DD에서 days만큼 지난 날짜(YYYY-MM-DD). 월 넘어가는 계산은 Date에 맡긴다. */
function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return toYmd(date.getFullYear(), date.getMonth(), date.getDate());
}

interface MonthCalendarGridProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  /** 선택한 날짜가 며칠 묵는 일정인지 — 0보다 크면 selectedDate부터 그만큼의 날짜를 한꺼번에
   * "선택됨"으로 표시한다(다박 일정은 시작일 하루만 골라도 실제로는 여러 날을 쓰기 때문). */
  nights?: number;
  /** 초록 점으로 표시할 날짜 집합(예: 이미 있는 당일치기 일정) — 없으면 점 표시 안 함. */
  markedDates?: Set<string>;
  /** 주황 짧은 선으로 표시할 날짜 집합(예: 이미 있는 1박 이상 일정이 걸쳐 있는 날) */
  lineDates?: Set<string>;
}

/**
 * 월 달력 그리드 — ScheduleCalendar(캘린더 세그)와 구조는 같지만, 저건 "선택한 날짜의 일정
 * 목록"까지 같이 보여주는 화면 전용이라 여기선 순수하게 "날짜 하나 고르기"만 떼어냈다.
 * 일정 등록 화면(course/[courseId]/schedule)이 `<input type="date">` 대신 이걸 쓴다.
 */
export function MonthCalendarGrid({
  selectedDate,
  onSelectDate,
  nights = 0,
  markedDates,
  lineDates,
}: MonthCalendarGridProps) {
  const selected = new Date(selectedDate);
  const [year, setYear] = useState(selected.getFullYear());
  const [month0, setMonth0] = useState(selected.getMonth());

  const selectedRange = useMemo(() => {
    const set = new Set<string>();
    for (let offset = 0; offset <= nights; offset++) set.add(addDays(selectedDate, offset));
    return set;
  }, [selectedDate, nights]);

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

  const today = new Date();
  const todayYmd = toYmd(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between">
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
          const isSelected = selectedRange.has(cell.date);
          const isToday = cell.date === todayYmd;
          const hasDot = markedDates?.has(cell.date);
          const hasLine = !hasDot && lineDates?.has(cell.date);
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDate(cell.date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border border-line pt-1 text-[10px] text-ink",
                isSelected && "border-brand-400 bg-brand-100",
                isToday && !isSelected && "border-brand"
              )}
            >
              <span>{cell.day}</span>
              {hasDot ? <span className="h-1 w-1 rounded-full bg-brand" /> : null}
              {hasLine ? <span className="h-[3px] w-2.5 rounded-full bg-accent-coral" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
