"use client";

import { QuestionCard } from "@/components/mbti/QuestionCard";
import type { MbtiAnswer, MbtiQuestion } from "@/lib/mbti";

interface QuestionStepProps {
  question: MbtiQuestion;
  index: number;
  total: number;
  selected: MbtiAnswer;
  onSelect: (answer: MbtiAnswer) => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
}

export function QuestionStep({
  question,
  index,
  total,
  selected,
  onSelect,
  onBack,
  onSkip,
  canGoBack,
}: QuestionStepProps) {
  return (
    <div className="px-5 pb-6 pt-2">
      <div className="mb-4 flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded ${i < index ? "bg-brand" : "bg-line-strong"}`} />
        ))}
      </div>
      <div className="mb-3 text-center text-xs font-bold text-ink-muted">
        질문 {index + 1} / {total}
      </div>
      <QuestionCard question={question} selected={selected} onSelect={onSelect} />
      <div className="mt-2 flex justify-between">
        {canGoBack ? (
          <button type="button" onClick={onBack} className="min-h-10 px-1.5 text-xs text-ink-muted">
            ‹ 이전 질문
          </button>
        ) : (
          <span />
        )}
        <button type="button" onClick={onSkip} className="min-h-10 px-1.5 text-xs text-ink-muted">
          이 질문만 건너뛰기 ›
        </button>
      </div>
    </div>
  );
}
