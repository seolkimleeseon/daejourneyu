"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { nightsLabel } from "@/lib/courseFormat";
import type { CourseTheme } from "@/lib/mbti";

interface NightsStepProps {
  theme: CourseTheme;
  nights: number;
  onChangeNights: (nights: number) => void;
  onNext: () => void;
}

const QUICK_OPTIONS = [0, 1, 2];
const MAX_NIGHTS = 4;

export function NightsStep({ theme, nights, onChangeNights, onNext }: NightsStepProps) {
  const clamp = (value: number) => Math.max(0, Math.min(MAX_NIGHTS, value));

  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-4 text-center text-sm font-bold text-ink">며칠 코스로 만들까요?</div>
      <div className="rounded-2xl border border-line bg-card p-4">
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => onChangeNights(clamp(nights - 1))}
            disabled={nights <= 0}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line-strong text-xl text-ink disabled:text-line-strong"
          >
            −
          </button>
          <div className="min-w-[110px] text-center">
            <div className="text-base font-bold text-brand-700">{nightsLabel(nights)}</div>
            <div className="mt-1 text-[11px] text-ink-muted">{theme}형 코스로 추천해드려요</div>
          </div>
          <button
            type="button"
            onClick={() => onChangeNights(clamp(nights + 1))}
            disabled={nights >= MAX_NIGHTS}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line-strong text-xl text-ink disabled:text-line-strong"
          >
            ＋
          </button>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          {QUICK_OPTIONS.map((n) => (
            <Tag key={n} active={nights === n} tone="brand" onClick={() => onChangeNights(n)}>
              {nightsLabel(n)}
            </Tag>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-surface p-4 text-xs leading-relaxed text-ink-muted">
        📅 출발 날짜는 지금 안 정해도 돼요
        <br />
        저장 후 [일정을 추가하기]에서 고르면 돼요
      </div>
      <Button className="mt-4" onClick={onNext}>
        다음
      </Button>
    </div>
  );
}
