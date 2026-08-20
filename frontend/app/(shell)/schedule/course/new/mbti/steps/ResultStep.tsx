"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { TraitChip } from "@/components/mbti/TraitChip";
import { ThemeBar } from "@/components/mbti/ThemeBar";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { resolveMbtiType, topTheme, type CourseTheme } from "@/lib/mbti";

interface ResultStepProps {
  code: string;
  onContinue: (theme: CourseTheme) => void;
  onRetake: () => void;
}

export function ResultStep({ code, onContinue, onRetake }: ResultStepProps) {
  const type = resolveMbtiType(code);
  const sortedThemes = (Object.entries(type.theme) as [CourseTheme, number][]).sort((a, b) => b[1] - a[1]);
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-5 pb-6 pt-2">
      <div ref={captureRef} className="rounded-2xl bg-surface p-4 text-center">
        <div className="mb-1 text-xs font-bold text-brand-700">대저니유 · 반려동물 여행 MBTI</div>
        <div className="text-5xl">{type.emoji}</div>
        <div className="mt-1 text-xl font-extrabold tracking-wide text-accent-purple">{code}</div>
        <div className="mb-2 text-sm font-bold text-ink">{type.name}</div>
        <div className="mb-3 text-xs leading-relaxed text-ink-muted">{type.desc}</div>
        <div className="mb-4 flex flex-wrap justify-center gap-1">
          {type.traits.map((trait) => (
            <TraitChip key={trait} label={trait} />
          ))}
        </div>
        <div className="mb-1 text-left text-xs font-bold text-ink-muted">맞춤 코스 테마</div>
        {sortedThemes.map(([theme, percent]) => (
          <ThemeBar key={theme} theme={theme} percent={percent} />
        ))}
      </div>
      <Button className="mt-4" onClick={() => onContinue(topTheme(type))}>
        이 성향으로 코스 만들기
      </Button>
      <ResultShareActions
        captureRef={captureRef}
        fileName="대저니유-MBTI결과"
        kakaoTitle={`나는 ${code} · ${type.name}!`}
        kakaoDescription="대저니유에서 반려동물 여행 MBTI 테스트 해보세요 🐾"
      />
      <button type="button" onClick={onRetake} className="mt-2 min-h-10 w-full text-xs text-ink-muted">
        🔄 다시 검사하기
      </button>
    </div>
  );
}
