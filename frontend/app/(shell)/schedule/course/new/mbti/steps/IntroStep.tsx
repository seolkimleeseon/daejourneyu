"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

interface IntroStepProps {
  onStart: () => void;
  onSkipToTheme: () => void;
}

const STATS = ["질문 12개", "16가지 유형", "약 1분"];

export function IntroStep({ onStart, onSkipToTheme }: IntroStepProps) {
  return (
    <div className="px-5 pb-6 pt-4 text-center">
      <div className="animate-pop-in mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-brand-100 text-6xl">
        🐾
      </div>
      <div className="animate-fade-up mb-2 text-lg font-extrabold leading-relaxed text-ink">
        내 댕이의
        <br />
        여행 MBTI는?
      </div>
      <div className="animate-fade-up mb-4 text-xs leading-relaxed text-ink-muted" style={{ animationDelay: "0.1s" }}>
        대전 맞춤 코스 테마까지 알려드려요
      </div>
      <div className="animate-fade-up mb-8 flex justify-center gap-1.5" style={{ animationDelay: "0.18s" }}>
        {STATS.map((stat) => (
          <Tag key={stat} tone="neutral" className="cursor-default">
            {stat}
          </Tag>
        ))}
      </div>
      <div className="animate-fade-up" style={{ animationDelay: "0.26s" }}>
        <Button onClick={onStart}>테스트 시작하기</Button>
        <button type="button" onClick={onSkipToTheme} className="mt-3 min-h-10 w-full text-xs text-ink-muted">
          테스트 건너뛰고 바로 코스 고르기 ›
        </button>
      </div>
    </div>
  );
}
