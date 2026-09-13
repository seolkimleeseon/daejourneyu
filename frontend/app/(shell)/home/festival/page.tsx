"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { FestivalLinks } from "@/components/home/FestivalLinks";
import { mockFestivals } from "@/mocks";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYmd(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

export default function HomeFestivalPage() {
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
  const selectedFestivals = mockFestivals.filter((f) => f.date === selectedDate);

  return (
    <>
      <TopBar title="축제 캘린더" showBack />
      <div className="px-4 pb-6 pt-3">
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
            const dayFestivals = mockFestivals.filter((f) => f.date === cell.date);
            const hasPetFriendly = dayFestivals.some((f) => f.petFriendly);
            const hasOther = dayFestivals.some((f) => !f.petFriendly);
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
                {hasPetFriendly || hasOther ? (
                  <span className="flex gap-0.5">
                    {hasPetFriendly ? <span className="h-1 w-1 rounded-full bg-brand" /> : null}
                    {hasOther ? <span className="h-1 w-1 rounded-full bg-accent-amber" /> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex gap-3 text-[10px] text-ink-muted">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> 반려동반 축제
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" /> 일반 축제
          </span>
        </div>

        <div className="mb-1 mt-5 px-1 text-xs font-bold text-ink-muted">{selectedDate} 일정</div>
        {selectedFestivals.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">이 날엔 등록된 축제가 없어요.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedFestivals.map((festival) => (
              <Card key={festival.id} className="cursor-default">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{festival.title}</span>
                  <Tag
                    tone={festival.petFriendly ? "brand" : "neutral"}
                    className="cursor-default px-2 py-1 text-[10px]"
                  >
                    {festival.petFriendly ? "동반 가능" : "동반 불가"}
                  </Tag>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-muted">
                    {festival.place} · {festival.time}
                  </span>
                  <FestivalLinks festival={festival} />
                </div>
                {festival.condition ? (
                  <div className="mt-1 text-[11px] text-ink-muted">{festival.condition}</div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
