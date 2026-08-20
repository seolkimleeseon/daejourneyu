"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { nightsLabel } from "@/lib/courseFormat";
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
  onSave,
  onGoHome,
}: GeneratedResultStepProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-4 pb-6 pt-1">
      <div ref={captureRef} className="rounded-2xl bg-surface p-2">
        <div className="mb-4 rounded-2xl bg-brand-100 p-4 text-center">
          <div className="text-sm font-extrabold text-brand-700">오늘의 &lsquo;{courseTitle}&rsquo;가 완성됐어요!</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            <Tag tone="brand" className="cursor-default">
              {nights > 0 ? "🌙" : "☀️"} {nightsLabel(nights)}
            </Tag>
            <Tag tone="purple" className="cursor-default">
              {transport === "자차" ? "🚗" : "🚌"} {transport}
            </Tag>
            <Tag tone="purple" className="cursor-default">
              👥 {companion}
            </Tag>
            <Tag tone="amber" className="cursor-default">
              💰 {budget}
            </Tag>
            <Tag tone="brand" className="cursor-default">
              🐾 동반 가능
            </Tag>
          </div>
        </div>

        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="mb-4 last:mb-0">
            {days.length > 1 ? (
              <div className="mb-2 text-xs font-bold text-ink-muted">
                📍 {dayIndex + 1}일차 동선 · {day.length}곳
              </div>
            ) : (
              <div className="mb-2 text-xs font-bold text-ink-muted">{theme}형 동선 · {day.length}곳</div>
            )}
            <div className="overflow-hidden rounded-2xl border border-line bg-card">
              {day.map((place, index) => (
                <div key={place.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-ink">{place.name}</div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {place.district} · {place.category}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Tag tone={place.petFriendly ? "brand" : "coral"} className="cursor-default px-2 py-1 text-[10px]">
                        {place.petFriendly ? "🐾 동반 가능" : "🚫 동반 불가"}
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
