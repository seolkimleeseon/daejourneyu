"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { routeDistanceKm } from "@/lib/nearestNeighborRoute";
import type { Place } from "@/types";

interface ReviewStepProps {
  days: Place[][];
  activeDay: number;
  onSetActiveDay: (day: number) => void;
  onMove: (dayIndex: number, from: number, direction: -1 | 1) => void;
  name: string;
  onChangeName: (name: string) => void;
  defaultName: string;
  onSave: () => void;
}

export function ReviewStep({
  days,
  activeDay,
  onSetActiveDay,
  onMove,
  name,
  onChangeName,
  defaultName,
  onSave,
}: ReviewStepProps) {
  const [editMode, setEditMode] = useState(false);
  const currentDay = days[activeDay] ?? [];
  const distanceKm = routeDistanceKm(currentDay);
  const captureRef = useRef<HTMLDivElement>(null);
  const totalCount = days.reduce((sum, day) => sum + day.length, 0);
  const displayName = name.trim() || defaultName;

  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-4 rounded-xl bg-brand-100 px-4 py-3 text-xs font-semibold text-brand-700">
        ✓ 시작 지점 기준으로 가까운 곳끼리 이어 최적 동선을 짰어요
      </div>

      {days.length > 1 ? (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {days.map((day, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSetActiveDay(index)}
              className={
                activeDay === index
                  ? "shrink-0 rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-white"
                  : "shrink-0 rounded-full border border-line bg-card px-3.5 py-2 text-xs font-semibold text-ink-muted"
              }
            >
              {index + 1}일차
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="text-xs font-bold text-ink-muted">
          {days.length > 1 ? `${activeDay + 1}일차 동선` : "동선"} · {currentDay.length}곳 · {distanceKm.toFixed(1)}km
        </span>
        <button
          type="button"
          onClick={() => setEditMode((prev) => !prev)}
          className={
            editMode
              ? "rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white"
              : "rounded-full border border-brand-300 bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-700"
          }
        >
          {editMode ? "✓ 완료" : "✏️ 편집"}
        </button>
      </div>

      <div ref={captureRef} className="mb-3 overflow-hidden rounded-xl border border-line bg-card">
        {currentDay.map((place, index) => (
          <div key={place.id} className="flex items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-purple-light text-[10px] font-bold text-accent-purple">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-bold text-ink">
                {place.name}
                {!place.petFriendly ? (
                  <Tag tone="coral" className="cursor-default px-2 py-0.5 text-[10px]">
                    🚫
                  </Tag>
                ) : null}
              </div>
              <div className="mt-0.5 text-[10px] text-ink-muted">
                {place.district} · {place.category}
              </div>
            </div>
            {editMode ? (
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMove(activeDay, index, -1)}
                  className="h-7 w-7 rounded-lg bg-surface text-xs text-ink-muted disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === currentDay.length - 1}
                  onClick={() => onMove(activeDay, index, 1)}
                  className="h-7 w-7 rounded-lg bg-surface text-xs text-ink-muted disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <ResultShareActions
        className="mb-5 flex gap-2"
        captureRef={captureRef}
        fileName={`대저니유-${displayName}`}
        kakaoTitle={displayName}
        kakaoDescription={`${totalCount}곳 · 대저니유에서 직접 지은 반려동물 여행 코스예요 🐾`}
      />

      <div className="mb-1 px-1 text-xs font-bold text-ink-muted">코스 이름</div>
      <input
        className="mb-3 w-full rounded-xl border border-line bg-card px-4 py-3.5 text-sm font-semibold text-ink outline-none focus:border-brand focus:bg-brand-100"
        placeholder={defaultName}
        value={name}
        onChange={(event) => onChangeName(event.target.value)}
      />
      <div className="mb-4 rounded-lg bg-surface p-4 text-xs leading-relaxed text-ink-muted">
        📌 저장하면 <b className="text-ink">보관함</b>에 담겨요 · 이름을 비워두면{" "}
        <b className="text-ink">{defaultName}</b>로 저장돼요
        <br />
        날짜는 나중에 [일정을 추가하기]로 고르면 돼요
      </div>
      <Button onClick={onSave}>코스 저장하기</Button>
    </div>
  );
}
