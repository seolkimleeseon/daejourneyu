"use client";

import { Emoji3D } from "@/components/ui/Emoji3D";
import type { CourseTheme } from "@/lib/mbti";

interface ThemePickerStepProps {
  onPick: (theme: CourseTheme) => void;
}

const THEME_OPTIONS: { theme: CourseTheme; emoji: string; sub: string }[] = [
  { theme: "산책", emoji: "🌳", sub: "갑천·계족산 등 자연 위주" },
  { theme: "맛집", emoji: "🥐", sub: "성심당 등 로컬 맛집 위주" },
  { theme: "문화", emoji: "🏛️", sub: "과학관·전시 등 실내 위주" },
];

export function ThemePickerStep({ onPick }: ThemePickerStepProps) {
  return (
    <div className="px-5 pb-6 pt-2">
      <div className="animate-fade-up mb-1 flex justify-center">
        <Emoji3D emoji="🎯" size={40} />
      </div>
      <div className="animate-fade-up mb-4 text-center text-sm font-bold text-ink">어떤 코스를 원하세요?</div>
      <div className="flex flex-col gap-2">
        {THEME_OPTIONS.map((option, i) => (
          <button
            key={option.theme}
            type="button"
            onClick={() => onPick(option.theme)}
            style={{ animationDelay: `${0.1 + i * 0.06}s` }}
            className="animate-fade-up rounded-lg border-[1.5px] border-line-strong bg-card p-3 text-center transition-colors active:border-brand-300 active:bg-brand-100"
          >
            <div className="mb-1 flex justify-center">
              <Emoji3D emoji={option.emoji} size={32} />
            </div>
            <div className="text-xs font-semibold text-ink">{option.theme}형</div>
            <div className="mt-0.5 text-[10px] text-ink-muted">{option.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
