"use client";

import { useRef, useState } from "react";
import { CourseButton as Button } from "@/components/course/CourseButton";
import { Tag } from "@/components/ui/Tag";
import { CourseRouteMap } from "@/components/course/CourseRouteMap";
import { DragReorderList } from "@/components/course/DragReorderList";
import { StopThumbnail } from "@/components/course/StopThumbnail";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { CourseShareCard } from "@/components/course/CourseShareCard";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { conditionSourceLabel, isUnverifiedCondition, NEEDS_CHECK_LABEL, nightsLabel, resolvePlaceImageUrl } from "@/lib/courseFormat";
import type { CourseTheme } from "@/lib/mbti";
import type { Place, Transport } from "@/types";

interface GeneratedResultStepProps {
  theme: CourseTheme;
  nights: number;
  transport: Transport;
  days: Place[][];
  courseTitle: string;
  routeLabel?: string;
  bakeryMode?: boolean;
  onReorderDay: (dayIndex: number, next: Place[]) => void;
  onRegenerate: () => void;
  onSave: () => void;
  onGoHome: () => void;
}

export function GeneratedResultStep({
  theme,
  nights,
  transport,
  days,
  courseTitle,
  routeLabel,
  bakeryMode = false,
  onReorderDay,
  onRegenerate,
  onSave,
  onGoHome,
}: GeneratedResultStepProps) {
  const [editMode, setEditMode] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-5 pb-6 pt-1">
      <div className="rounded-2xl bg-surface p-2">
        <div className="mb-4 rounded-2xl bg-brand-100 p-4 text-center">
          <div className="text-sm font-extrabold text-brand-700">&lsquo;{courseTitle}&rsquo;가 완성됐어요!</div>
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {bakeryMode ? (
              <Tag tone="neutral" className="cursor-default border border-line bg-card">
                🔍 빵집 반려견 동반여부 확인 필요
              </Tag>
            ) : (
              <>
            <Tag tone="brand" className="cursor-default border border-line bg-card">
              {nights > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Emoji3D emoji="🌙" size={14} shadow={false} className="shrink-0" />
                  {nightsLabel(nights)}
                </span>
              ) : (
                `☀️ ${nightsLabel(nights)}`
              )}
            </Tag>
            <Tag tone="purple" className="cursor-default border border-line bg-card">
              {transport === "자차" ? "🚗" : "🚌"} {transport}
            </Tag>
            <Tag tone={days.some((day) => day.some((place) => !place.petFriendly)) ? "neutral" : "brand"} className="flex cursor-default items-center gap-1 border border-line bg-card">
              {days.some((day) => day.some((place) => !place.petFriendly)) ? "🔍 동반 여부 확인 필요" : <><Emoji3D emoji="🐾" size={12} shadow={false} />동반 가능</>}
            </Tag>
              </>
            )}
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between px-1">
          <button type="button" onClick={onRegenerate} className="rounded-full border border-brand-300 bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-700">
            다른 코스 추천받기
          </button>
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
          <div key={dayIndex} className="mb-4 last:mb-0">
            <div className="mb-2 flex items-center gap-1 px-1 text-xs font-bold text-ink-muted">
              <Emoji3D emoji="📍" size={14} shadow={false} />
              {days.length > 1 ? `${dayIndex + 1}일차 동선` : routeLabel ?? `${theme}형 동선`} · {day.length}곳
            </div>
            {day.length > 0 ? <CourseRouteMap places={day} /> : null}
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
                    <StopThumbnail category={place.category} placeId={place.id} imageUrl={resolvePlaceImageUrl(place)} badge={index + 1} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-ink">{place.name}</div>
                      <div className="mt-0.5 text-xs text-ink-muted">
                        {place.district} · {place.category}
                      </div>
                      {!editMode ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {/* "확인해주세요" 류 비확정 안내(카카오·공공데이터 tier2)는 출처 태그 +
                              표준 안내 태그 두 개로 짧게 보여준다. */}
                          {isUnverifiedCondition(place.condition) ? (
                            <>
                              <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                                {conditionSourceLabel(place.condition)}
                              </Tag>
                              <Tag tone="neutral" className="cursor-default px-2 py-1 text-[10px]">
                                {NEEDS_CHECK_LABEL}
                              </Tag>
                            </>
                          ) : (
                            <Tag
                              tone={place.petFriendly ? "brand" : "coral"}
                              className="flex cursor-default items-center gap-0.5 px-2 py-1 text-[10px]"
                            >
                              {place.petFriendly ? (
                                <>
                                  <Emoji3D emoji="🐾" size={10} shadow={false} />동반 가능
                                </>
                              ) : (
                                "🚫 동반 불가"
                              )}
                            </Tag>
                          )}
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

      {/* 저장/공유용 캡처 전용 카드 — 화면엔 안 보이고 이미지 저장·카카오 공유할 때만 쓰인다. */}
      <div style={{ position: "fixed", top: 0, left: -9999 }} aria-hidden="true">
        <div ref={shareCardRef}>
          <CourseShareCard
            title={courseTitle}
            tags={[nightsLabel(nights), routeLabel ?? `${theme}형`, transport]}
            days={days}
          />
        </div>
      </div>

      <ResultShareActions
        className="mb-4 mt-3 flex gap-2"
        captureRef={shareCardRef}
        fileName={`대저니유-${courseTitle}`}
        kakaoTitle={courseTitle}
        kakaoDescription={`${nightsLabel(nights)} · ${routeLabel ?? `${theme}형 코스`} · 대저니유에서 만든 반려동물 여행 코스예요 🐾`}
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
