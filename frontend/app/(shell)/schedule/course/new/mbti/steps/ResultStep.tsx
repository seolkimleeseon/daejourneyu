"use client";

import { useRef } from "react";
import { CourseButton } from "@/components/course/CourseButton";
import { Button } from "@/components/ui/Button";
import { TraitChip } from "@/components/mbti/TraitChip";
import { ThemeBar } from "@/components/mbti/ThemeBar";
import { TraitStatBar } from "@/components/mbti/TraitStatBar";
import { MbtiCharacter } from "@/components/mbti/MbtiCharacter";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { resolveMbtiType, structureAxisLabel, structureAxisValue, topTheme, type CourseTheme } from "@/lib/mbti";

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
      <div ref={captureRef} className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="bg-brand-100 px-4 pb-4 pt-3 text-center">
          <div className="flex items-center justify-between font-mono text-[9px] font-bold tracking-widest text-brand-700/70">
            <span>PET MBTI</span>
            <span>DAEJEONIYU</span>
          </div>

          <MbtiCharacter code={code} name={type.name} size={112} />

          <div className="text-xl font-extrabold tracking-wide text-accent-purple">{code}</div>
          <div className="mb-1.5 text-sm font-bold text-ink">{type.name}</div>
          <div className="mb-3 text-xs font-semibold italic text-accent-purple">&ldquo;{type.tagline}&rdquo;</div>
          <div className="text-xs leading-relaxed text-ink-muted">{type.desc}</div>
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {type.traits.map((trait) => (
              <TraitChip key={trait} label={trait} />
            ))}
          </div>
        </div>

        <div className="relative mx-3.5 h-0 border-t border-dashed border-brand-700/25">
          <span className="absolute -left-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
          <span className="absolute -right-[22px] -top-2 h-4 w-4 rounded-full bg-surface" />
        </div>

        <div className="p-4 text-center">
          <div className="mb-4 rounded-xl bg-surface p-3">
            <div className="mb-2 text-left text-xs font-bold text-ink-muted">성향 그래프</div>
            <TraitStatBar label="사교성" value={type.stats.social} />
            <TraitStatBar label="탐험성" value={type.stats.explore} />
            <TraitStatBar label="표현력" value={type.stats.expressive} />
            <TraitStatBar label={structureAxisLabel(code)} value={structureAxisValue(code, type.stats)} />
          </div>

          <div className="mb-4 rounded-xl bg-surface p-3 text-left">
            <div className="mb-1 flex items-center gap-1 text-xs font-bold text-ink">
              <Emoji3D emoji="🐾" size={14} shadow={false} />찰떡 코스
            </div>
            <div className="mb-2 text-[11px] leading-relaxed text-ink-muted">{type.goodFor}</div>
            <div className="mb-1 text-xs font-bold text-ink">😮‍💨 조금 힘들 수 있어요</div>
            <div className="text-[11px] leading-relaxed text-ink-muted">{type.toughFor}</div>
          </div>

          <div className="mb-1 text-left text-xs font-bold text-ink-muted">맞춤 코스 테마</div>
          {sortedThemes.map(([theme, percent]) => (
            <ThemeBar key={theme} theme={theme} percent={percent} />
          ))}
        </div>
      </div>
      <div>
        <CourseButton className="mt-4 gap-1.5" onClick={() => onContinue(topTheme(type))}>
          <Emoji3D emoji="🐾" size={20} shadow={false} className="shrink-0" />
          <span>이 성향으로 코스 만들기</span>
        </CourseButton>
        <ResultShareActions
          captureRef={captureRef}
          fileName="대저니유-MBTI결과"
          kakaoTitle={`나는 ${code} · ${type.name}!`}
          kakaoDescription="대저니유에서 반려동물 여행 MBTI 테스트 해보세요 🐾"
        />
        <Button variant="text" className="mt-1 w-full" onClick={onRetake}>
          🔄 다시 검사하기
        </Button>
        <div className="mt-3 text-center text-[10px] leading-relaxed text-ink-muted">
          ※ 본 테스트는 MBTI 형식을 활용해 반려견의 행동 성향을 재미있게 알아보는 콘텐츠입니다.
        </div>
      </div>
    </div>
  );
}
