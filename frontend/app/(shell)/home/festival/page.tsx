"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { FestivalLinks } from "@/components/home/FestivalLinks";
import { useFestivals } from "@/hooks/useFestivals";
import type { FestivalEvent } from "@/types";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYmd(year: number, month0: number, day: number) {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

/** 다일간 축제 지원 — date~endDate 범위 안에 있으면 그 날짜의 행사로 취급한다. */
function isFestivalOnDate(festival: FestivalEvent, ymd: string) {
  return festival.date <= ymd && ymd <= (festival.endDate ?? festival.date);
}

/**
 * 동반 가능 뱃지는 4단계로 나눈다 — 일반 축제 API는 행사 자체의 동반 허용 여부를 모르기 때문에
 * (petFriendlyUnknown), false를 곧바로 "동반 불가"로 단정하지 않는다. 장소가 반려동반 인증된
 * 곳 근처라는 신호(venuePetFriendly)가 있으면 그 사실만 별도로 표시한다.
 */
function getPetTag(festival: FestivalEvent): { label: string; tone: "brand" | "amber" | "neutral" } {
  if (festival.petFriendly) return { label: "동반 가능", tone: "brand" };
  if (festival.venuePetFriendly) return { label: "장소 인증", tone: "amber" };
  if (festival.petFriendlyUnknown) return { label: "미확인", tone: "neutral" };
  return { label: "동반 불가", tone: "neutral" };
}

/**
 * 대전을 대표하는 축제인데도 공공데이터 어디에도 올해 날짜가 없는 것들 — 유성온천문화축제는
 * 관광공사 DB에 eventstartdate 필드 자체가 비어있고, 대전0시축제(구 대전0시뮤직페스티벌)는
 * 대전시 자체 목록에 2022년 날짜로 방치돼 있다. 틀린 날짜를 캘린더에 꽂느니 이름만 별도 안내한다.
 * expectedMonth(1~12)는 매년 열리는 대략적인 달 — 캘린더가 그 시기 근처를 보고 있을 때만 노출한다.
 */
const PENDING_FLAGSHIP_FESTIVALS = [
  { title: "유성온천문화축제", periodHint: "매년 10월경 · 유성구 유림공원 일원", expectedMonth: 10 },
  { title: "대전0시축제", periodHint: "매년 8월 초순 · 대흥동·으능정이거리 일원", expectedMonth: 8 },
];

/** 참고 목록은 예상 시기와 동떨어진 달까지 상시 노출하면 오히려 오해를 준다 —
 * 예상 달 기준 2개월 전 ~ 1개월 후를 보고 있을 때만 보여준다. */
const FLAGSHIP_MONTHS_BEFORE = 2;
const FLAGSHIP_MONTHS_AFTER = 1;

function isNearExpectedMonth(viewedMonth1: number, expectedMonth1: number): boolean {
  const monthsAfterExpected = ((viewedMonth1 - expectedMonth1 + 12) % 12);
  return monthsAfterExpected <= FLAGSHIP_MONTHS_AFTER || monthsAfterExpected >= 12 - FLAGSHIP_MONTHS_BEFORE;
}

/** 캘린더가 넘나들 수 있는 월 범위 — 백엔드가 실제로 채워주는 데이터 창(과거 3개월~미래 12개월,
 * festivals.ts의 WINDOW_DAYS_PAST/FUTURE)과 맞춰둔다. 그 밖의 달은 봐도 무조건 텅 비어 있으니
 * 아예 못 넘어가게 막는다. */
const NAV_MONTHS_PAST = 3;
const NAV_MONTHS_FUTURE = 12;

function toMonthIndex(year: number, month0: number) {
  return year * 12 + month0;
}

export default function HomeFestivalPage() {
  const { data: festivals, isLoading } = useFestivals();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toYmd(today.getFullYear(), today.getMonth(), today.getDate()));

  const todayMonthIndex = toMonthIndex(today.getFullYear(), today.getMonth());
  const minMonthIndex = todayMonthIndex - NAV_MONTHS_PAST;
  const maxMonthIndex = todayMonthIndex + NAV_MONTHS_FUTURE;
  const currentMonthIndex = toMonthIndex(year, month0);
  const canGoPrevMonth = currentMonthIndex > minMonthIndex;
  const canGoNextMonth = currentMonthIndex < maxMonthIndex;

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
    const nextIndex = toMonthIndex(nextYear, nextMonth);
    if (nextIndex < minMonthIndex || nextIndex > maxMonthIndex) return;
    setMonth0(nextMonth);
    setYear(nextYear);
  };

  const todayYmd = toYmd(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedFestivals = festivals.filter((f) => isFestivalOnDate(f, selectedDate));
  const visibleFlagshipFestivals = PENDING_FLAGSHIP_FESTIVALS.filter((f) =>
    isNearExpectedMonth(month0 + 1, f.expectedMonth)
  );

  return (
    <>
      <TopBar title="축제 캘린더" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={!canGoPrevMonth}
            className={cn("px-2 text-sm text-ink-muted", !canGoPrevMonth && "opacity-30")}
          >
            ‹
          </button>
          <span className="text-sm font-bold text-ink">
            {year}년 {month0 + 1}월
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={!canGoNextMonth}
            className={cn("px-2 text-sm text-ink-muted", !canGoNextMonth && "opacity-30")}
          >
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
            const dayFestivals = festivals.filter((f) => isFestivalOnDate(f, cell.date));
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
        {isLoading ? (
          <div className="py-8 text-center text-xs text-ink-muted">축제 정보를 불러오는 중이에요...</div>
        ) : selectedFestivals.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">이 날엔 등록된 축제가 없어요.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {selectedFestivals.map((festival) => {
              const petTag = getPetTag(festival);
              return (
                <Card key={festival.id} className="cursor-default">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-ink">{festival.title}</span>
                      <Tag tone={petTag.tone} className="shrink-0 cursor-default px-2 py-1 text-[10px]">
                        {petTag.label}
                      </Tag>
                    </div>
                    <FestivalLinks festival={festival} />
                  </div>
                  <div className="mt-1 text-[11px] text-ink-muted">
                    {festival.place}
                    {festival.time ? ` · ${festival.time}` : ""}
                  </div>
                  {festival.condition ? (
                    <div className="mt-1 text-[11px] text-ink-muted">{festival.condition}</div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}

        {visibleFlagshipFestivals.length > 0 ? (
          <div className="mt-5">
            <div className="mb-1 px-1 text-[11px] font-bold text-ink-muted">
              참고 · 대전 대표 축제(날짜 발표 전)
            </div>
            <Card className="cursor-default divide-y divide-line !p-0">
              {visibleFlagshipFestivals.map((festival) => (
                <div key={festival.title} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-xs font-semibold text-ink-muted">{festival.title}</span>
                  <span className="shrink-0 text-right text-[10px] text-ink-muted">{festival.periodHint}</span>
                </div>
              ))}
            </Card>
            <div className="mt-1 px-1 text-[9px] text-ink-muted">공식 채널에서 정확한 날짜를 확인해주세요</div>
          </div>
        ) : null}
      </div>
    </>
  );
}
