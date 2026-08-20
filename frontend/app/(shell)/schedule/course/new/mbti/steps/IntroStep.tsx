"use client";

import { Button } from "@/components/ui/Button";

interface IntroStepProps {
  onStart: () => void;
  onSkipToTheme: () => void;
}

export function IntroStep({ onStart, onSkipToTheme }: IntroStepProps) {
  return (
    <div className="px-5 pb-6 pt-2 text-center">
      <div className="my-6 text-5xl">🐾</div>
      <div className="mb-2 text-base font-bold leading-relaxed text-ink">
        내 댕이의
        <br />
        여행 MBTI는?
      </div>
      <div className="mb-8 text-xs leading-relaxed text-ink-muted">
        질문 12개 · 16가지 유형 · 약 1분
        <br />
        대전 맞춤 코스 테마까지 알려드려요
      </div>
      <Button onClick={onStart}>테스트 시작하기</Button>
      <button type="button" onClick={onSkipToTheme} className="mt-3 min-h-10 w-full text-xs text-ink-muted">
        테스트 건너뛰고 바로 코스 고르기 ›
      </button>
    </div>
  );
}
