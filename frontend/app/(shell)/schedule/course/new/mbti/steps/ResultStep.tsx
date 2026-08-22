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
      <div ref={captureRef} className="relative overflow-hidden rounded-2xl bg-brand-100 p-4 text-center">
        <div className="animate-fade-up text-xs font-bold text-brand-700">대저니유 · 반려동물 여행 MBTI</div>

        <div className="relative mx-auto my-4 flex h-28 w-28 items-center justify-center rounded-full bg-card animate-pop-in">
          <span className="animate-float text-6xl">{type.emoji}</span>
        </div>

        <div className="animate-fade-up text-xl font-extrabold tracking-wide text-accent-purple" style={{ animationDelay: "0.15s" }}>
          {code}
        </div>
        <div className="animate-fade-up mb-2 text-sm font-bold text-ink" style={{ animationDelay: "0.22s" }}>
          {type.name}
        </div>
        <div className="animate-fade-up mb-3 text-xs leading-relaxed text-ink-muted" style={{ animationDelay: "0.28s" }}>
          {type.desc}
        </div>
        <div className="mb-4 flex flex-wrap justify-center gap-1">
          {type.traits.map((trait, i) => (
            <TraitChip key={trait} label={trait} delay={0.35 + i * 0.08} />
          ))}
        </div>
        <div className="animate-fade-up mb-1 text-left text-xs font-bold text-ink-muted" style={{ animationDelay: "0.5s" }}>
          맞춤 코스 테마
        </div>
        {sortedThemes.map(([theme, percent], i) => (
          <ThemeBar key={theme} theme={theme} percent={percent} delay={0.55 + i * 0.1} />
        ))}
      </div>
      <div className="animate-fade-up" style={{ animationDelay: "0.9s" }}>
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
    </div>
  );
}
