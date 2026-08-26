"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { StopThumbnail } from "@/components/course/StopThumbnail";
import { resolvePlaceImageUrl } from "@/lib/courseFormat";
import { useSheetStore } from "@/stores/useSheetStore";
import { useToastStore } from "@/stores/useToastStore";
import type { Place } from "@/types";

interface PlacesStepProps {
  days: Place[][];
  startIds: Record<number, string>;
  activeDay: number;
  onSetActiveDay: (day: number) => void;
  onSetStart: (dayIndex: number, placeId: string) => void;
  onRemove: (dayIndex: number, placeId: string) => void;
  onApplyPicked: (dayIndex: number, places: Place[]) => void;
  onNext: () => void;
}

export function PlacesStep({
  days,
  startIds,
  activeDay,
  onSetActiveDay,
  onSetStart,
  onRemove,
  onApplyPicked,
  onNext,
}: PlacesStepProps) {
  const openSheet = useSheetStore((state) => state.open);
  const showToast = useToastStore((state) => state.show);
  const currentDayPlaces = days[activeDay] ?? [];
  const start = startIds[activeDay];
  const startValid = !!start && currentDayPlaces.some((place) => place.id === start);
  const totalCount = days.reduce((sum, day) => sum + day.length, 0);
  const allDaysReady = days.every((day) => day.length > 0);

  const dayLabel = days.length > 1 ? `${activeDay + 1}일차` : "";

  const handleOpenPicker = () => {
    openSheet({
      title: days.length > 1 ? `${activeDay + 1}일차에 담을 장소` : "담을 장소 고르기",
      initialSelected: currentDayPlaces,
      onDone: (picked) => {
        const otherDaysNames = new Set(
          days.flatMap((day, index) => (index === activeDay ? [] : day.map((place) => place.name)))
        );
        const filtered = picked.filter((place) => !otherDaysNames.has(place.name));
        if (filtered.length !== picked.length) {
          showToast("다른 일차에 이미 담긴 장소는 제외했어요");
        }
        onApplyPicked(activeDay, filtered);
      },
    });
  };

  return (
    <div className="animate-fade-up px-4 pb-6 pt-1">
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
              {index + 1}일차{" "}
              <span
                className={
                  activeDay === index
                    ? "ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[10px]"
                    : "ml-1 rounded-full bg-line px-1.5 py-0.5 text-[10px]"
                }
              >
                {day.length}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="text-xs font-bold text-ink-muted">가고 싶은 곳</span>
        <span className="text-xs text-ink-muted">{currentDayPlaces.length}곳</span>
      </div>

      {currentDayPlaces.length > 0 ? (
        <div
          className={
            startValid
              ? "mb-3 rounded-lg bg-brand-100 px-3 py-2.5 text-xs leading-relaxed text-brand-700"
              : "mb-3 rounded-lg bg-brand-100 px-3 py-2.5 text-xs leading-relaxed text-brand-700"
          }
        >
          📍 {startValid ? (
            <>
              <b>{currentDayPlaces.find((p) => p.id === start)?.name}</b>에서 {dayLabel ? `${dayLabel} ` : ""}여행을
              시작해요
            </>
          ) : (
            <>여행을 시작할 <b>기준 지점</b>을 골라주세요</>
          )}
        </div>
      ) : null}

      {currentDayPlaces.length > 0 ? (
        <div className="mb-3 overflow-hidden rounded-xl border border-line bg-card">
          {currentDayPlaces.map((place, index) => {
            const isStart = start === place.id;
            return (
              <div
                key={place.id}
                className={
                  isStart
                    ? "flex items-center gap-3 border-b border-line bg-brand-100 px-3.5 py-3 last:border-b-0"
                    : "flex items-center gap-3 border-b border-line px-3.5 py-3 last:border-b-0"
                }
                onClick={() => onSetStart(activeDay, place.id)}
              >
                <div
                  className={
                    isStart
                      ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-brand text-[10px] text-brand"
                      : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-line-strong text-[10px]"
                  }
                >
                  {isStart ? "●" : ""}
                </div>
                <StopThumbnail category={place.category} imageUrl={resolvePlaceImageUrl(place)} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 text-sm font-bold text-ink">
                    {place.name}
                    {isStart ? (
                      <Tag tone="brand" className="cursor-default px-2 py-0.5 text-[10px]">
                        시작점
                      </Tag>
                    ) : null}
                    <Tag
                      tone={place.petFriendly ? "brand" : "coral"}
                      className="cursor-default px-2 py-0.5 text-[10px]"
                    >
                      {place.petFriendly ? "🐾 동반 가능" : "🚫 동반 불가"}
                    </Tag>
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink-muted">
                    {place.district} · {place.category}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(activeDay, place.id);
                  }}
                  className="shrink-0 rounded-lg bg-surface px-2 py-1 text-xs text-accent-coral"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-3 rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
          <div className="text-3xl">📍</div>
          <div className="mt-2 text-xs font-bold text-ink">{dayLabel ? `${dayLabel}가` : "담은 곳이"} 비어 있어요</div>
          <div className="mt-1 text-[11px] text-ink-muted">아래 버튼으로 가고 싶은 곳을 담아보세요</div>
        </div>
      )}

      <button
        type="button"
        onClick={handleOpenPicker}
        className="mb-5 w-full rounded-xl border-[1.5px] border-dashed border-brand-300 bg-brand-100 py-3.5 text-center text-sm font-bold text-brand-700"
      >
        ＋ {dayLabel ? `${dayLabel}에 ` : ""}장소 추가하기
      </button>

      <Button disabled={totalCount < 2 || !allDaysReady} onClick={onNext}>
        최적 동선 확인하기
      </Button>
      {totalCount < 2 ? (
        <div className="mt-2 text-center text-[11px] text-ink-muted">최소 2곳을 담아주세요</div>
      ) : !allDaysReady ? (
        <div className="mt-2 text-center text-[11px] text-ink-muted">비어 있는 일차가 있어요</div>
      ) : null}
    </div>
  );
}
