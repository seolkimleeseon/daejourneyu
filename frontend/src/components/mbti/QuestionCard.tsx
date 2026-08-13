"use client";

import { cn } from "@/lib/cn";
import type { MbtiAnswer, MbtiQuestion } from "@/lib/mbti";

interface QuestionCardProps {
  question: MbtiQuestion;
  selected: MbtiAnswer;
  onSelect: (answer: MbtiAnswer) => void;
}

export function QuestionCard({ question, selected, onSelect }: QuestionCardProps) {
  const cardClass = (letter: string) =>
    cn(
      "rounded-lg border-[1.5px] border-line-strong bg-card p-3 text-center transition-colors",
      selected === letter && "border-brand-300 bg-brand-100"
    );

  return (
    <div>
      <span className="mb-1.5 block text-center text-[9px] font-semibold text-accent-purple">{question.tag}</span>
      <div className="mb-2 text-center text-3xl">{question.emoji}</div>
      <div className="mb-4 text-center text-sm font-semibold leading-relaxed text-ink">{question.question}</div>
      <div className="flex flex-col gap-2">
        <button type="button" className={cardClass(question.optionA.letter)} onClick={() => onSelect(question.optionA.letter)}>
          <div className="mb-1 text-xl">{question.optionA.emoji}</div>
          <div className="text-xs font-semibold text-ink">{question.optionA.label}</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">{question.optionA.sub}</div>
        </button>
        <button type="button" className={cardClass(question.optionB.letter)} onClick={() => onSelect(question.optionB.letter)}>
          <div className="mb-1 text-xl">{question.optionB.emoji}</div>
          <div className="text-xs font-semibold text-ink">{question.optionB.label}</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">{question.optionB.sub}</div>
        </button>
        <button type="button" className={cardClass("NEUTRAL")} onClick={() => onSelect("NEUTRAL")}>
          <div className="mb-1 text-xl">🤔</div>
          <div className="text-xs font-semibold text-ink">반반이에요</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">둘 다 비슷해요</div>
        </button>
      </div>
    </div>
  );
}
