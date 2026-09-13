"use client";

import { cn } from "@/lib/cn";
import { Emoji3D } from "@/components/ui/Emoji3D";
import type { MbtiAnswer, MbtiQuestion } from "@/lib/mbti";

interface QuestionCardProps {
  question: MbtiQuestion;
  selected: MbtiAnswer;
  onSelect: (answer: MbtiAnswer) => void;
}

export function QuestionCard({ question, selected, onSelect }: QuestionCardProps) {
  const cardClass = (letter: string) =>
    cn(
      "rounded-lg border-[1.5px] border-line-strong bg-card p-4 text-center transition-colors",
      selected === letter && "border-brand-300 bg-brand-100"
    );

  return (
    <div>
      <div className="mb-6">
        <span className="mb-2 block text-center text-[9px] font-semibold text-accent-purple">{question.tag}</span>
        <div className="mb-3 flex justify-center">
          <Emoji3D emoji={question.emoji} size={56} glowClassName="bg-brand-300" />
        </div>
        <div className="text-center text-sm font-semibold leading-relaxed text-ink">{question.question}</div>
      </div>
      <div className="flex flex-col gap-3">
        <button type="button" className={cardClass(question.optionA.letter)} onClick={() => onSelect(question.optionA.letter)}>
          <div className="mb-1.5 flex justify-center">
            <Emoji3D emoji={question.optionA.emoji} size={36} shadow={false} />
          </div>
          <div className="text-xs font-semibold text-ink">{question.optionA.label}</div>
          <div className="mt-1 text-[10px] text-ink-muted">{question.optionA.sub}</div>
        </button>
        <button type="button" className={cardClass(question.optionB.letter)} onClick={() => onSelect(question.optionB.letter)}>
          <div className="mb-1.5 flex justify-center">
            <Emoji3D emoji={question.optionB.emoji} size={36} shadow={false} />
          </div>
          <div className="text-xs font-semibold text-ink">{question.optionB.label}</div>
          <div className="mt-1 text-[10px] text-ink-muted">{question.optionB.sub}</div>
        </button>
        <button type="button" className={cardClass("NEUTRAL")} onClick={() => onSelect("NEUTRAL")}>
          <div className="mb-1.5 flex justify-center">
            <Emoji3D emoji="🤔" size={36} shadow={false} />
          </div>
          <div className="text-xs font-semibold text-ink">반반이에요</div>
          <div className="mt-1 text-[10px] text-ink-muted">둘 다 비슷해요</div>
        </button>
      </div>
    </div>
  );
}
