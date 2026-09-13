"use client";

import { QuestionCard } from "@/components/mbti/QuestionCard";
import { Emoji3D } from "@/components/ui/Emoji3D";
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
    <div className="px-5 pb-6 pt-4">
      <div className="mb-6 flex items-center justify-between px-1">
        {Array.from({ length: total }, (_, i) => (
          <Emoji3D key={i} emoji="🐾" size={20} shadow={false} className={i < index ? "opacity-100" : "opacity-20"} />
        ))}
      </div>
      <div className="mb-4 text-center text-xs font-bold text-ink-muted">
        질문 {index + 1} / {total}
      </div>
      <QuestionCard question={question} selected={selected} onSelect={onSelect} />
      <div className="mt-5 flex justify-between">
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
