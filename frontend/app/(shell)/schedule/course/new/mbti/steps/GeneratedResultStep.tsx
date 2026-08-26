"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { DragReorderList } from "@/components/course/DragReorderList";
import { StopThumbnail } from "@/components/course/StopThumbnail";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { nightsLabel, resolvePlaceImageUrl } from "@/lib/courseFormat";
import type { CourseTheme } from "@/lib/mbti";
import type { Place, Transport } from "@/types";

interface GeneratedResultStepProps {
  theme: CourseTheme;
  nights: number;
  companion: string;
  budget: string;
  transport: Transport;
  days: Place[][];
  courseTitle: string;
  onReorderDay: (dayIndex: number, next: Place[]) => void;
  onSave: () => void;
  onGoHome: () => void;
}

export function GeneratedResultStep({
  theme,
  nights,
  companion,
  budget,
  transport,
  days,
  courseTitle,
  onReorderDay,
  onSave,
  onGoHome,
}: GeneratedResultStepProps) {
  const [editMode, setEditMode] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-4 pb-6 pt-1">
      <div ref={captureRef} className="rounded-2xl bg-surface p-2">
        <div className="animate-pop-in mb-4 rounded-2xl bg-brand-100 p-4 text-center">
          <div className="text-sm font-extrabold text-brand-700">오늘의 &lsquo;{courseTitle}&rsquo;가 완성됐어요!</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            <Tag tone="brand" className="cursor-default border border-line bg-card">
              {nights > 0 ? "🌙" : "☀️"} {nightsLabel(nights)}
            </Tag>
            <Tag tone="purple" className="cursor-default border border-line bg-card">
              {transport === "자차" ? "🚗" : "🚌"} {transport}
            </Tag>
            <Tag tone="purple" className="cursor-default border border-line bg-card">
              👥 {companion}
            </Tag>
            <Tag tone="amber" className="cursor-default border border-line bg-card">
              💰 {budget}
            </Tag>
            <Tag tone="brand" className="cursor-default border border-line bg-card">
              🐾 동반 가능
            </Tag>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-end px-1">
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className={
              editMode
                ? "rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white"
                : "rounded-full border border-brand-300 bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-700"
            }
          >
            {editMode ? "✓ 완료" : "✏️ 순서 편집"}
          </button>
        </div>

        {days.map((day, dayIndex) => (
          <div
            key={dayIndex}
            style={{ animationDelay: `${0.15 + dayIndex * 0.08}s` }}
            className="animate-fade-up mb-4 last:mb-0"
          >
            <div className="mb-2 px-1 text-xs font-bold text-ink-muted">
              {days.length > 1 ? `📍 ${dayIndex + 1}일차 동선` : `📍 ${theme}형 동선`} · {day.length}곳
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
              <DragReorderList
                items={day}
                getId={(place) => place.id}
                onReorder={(next) => onReorderDay(dayIndex, next)}
                renderRow={(place, index, ref, dragHandleProps) => (
                  <div ref={ref} className="flex items-center gap-2.5 border-b border-line px-4 py-3 last:border-b-0">
                    {editMode ? (
                      <button
                        type="button"
                        {...dragHandleProps}
                        className="flex h-9 w-6 shrink-0 touch-none items-center justify-center text-base text-ink-muted"
                        aria-label="순서 바꾸기(드래그)"
                      >
                        ⠿
                      </button>
                    ) : null}
                    <StopThumbnail category={place.category} imageUrl={resolvePlaceImageUrl(place)} badge={index + 1} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-ink">{place.name}</div>
                      <div className="mt-0.5 text-xs text-ink-muted">
                        {place.district} · {place.category}
                      </div>
                      {!editMode ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <Tag tone={place.petFriendly ? "brand" : "coral"} className="cursor-default px-2 py-1 text-[10px]">
                            {place.petFriendly ? "🐾 동반 가능" : "🚫 동반 불가"}
                          </Tag>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        ))}
        {editMode ? (
          <div className="text-center text-[11px] text-ink-muted">⠿ 을 눌러 위아래로 드래그하면 순서가 바뀌어요</div>
        ) : null}
      </div>

      <ResultShareActions
        className="mb-4 mt-3 flex gap-2"
        captureRef={captureRef}
        fileName={`대저니유-${courseTitle}`}
        kakaoTitle={courseTitle}
        kakaoDescription={`${nightsLabel(nights)} · ${theme}형 코스 · 대저니유에서 만든 반려동물 여행 코스예요 🐾`}
      />

      <div className="mb-4 rounded-lg bg-surface p-4 text-xs leading-relaxed text-ink-muted">
        📌 저장하면 <b className="text-ink">보관함</b>에 담겨요
        <br />
        출발 날짜는 <b className="text-ink">[일정을 추가하기]</b>에서 나중에 고르면 돼요
      </div>
      <Button onClick={onSave}>코스 저장하기</Button>
      <button type="button" onClick={onGoHome} className="mt-2 min-h-10 w-full text-xs text-ink-muted">
        홈으로
      </button>
    </div>
  );
}
