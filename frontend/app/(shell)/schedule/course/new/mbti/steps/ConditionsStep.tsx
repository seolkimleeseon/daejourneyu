"use client";

import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

interface ConditionsStepProps {
  companion: string;
  budget: string;
  season: string;
  onChangeCompanion: (value: string) => void;
  onChangeBudget: (value: string) => void;
  onChangeSeason: (value: string) => void;
  onNext: () => void;
}

const COMPANIONS = ["나와 강아지", "커플", "가족", "친구"];
const BUDGETS = ["3만원 이하", "3~7만원", "7만원 이상"];
const SEASONS = ["봄", "여름", "가을", "겨울"];

function ChipRow({
  options,
  current,
  onChange,
}: {
  options: string[];
  current: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5 px-1">
      {options.map((option) => (
        <Tag key={option} active={current === option} tone="brand" onClick={() => onChange(option)}>
          {option}
        </Tag>
      ))}
    </div>
  );
}

export function ConditionsStep({
  companion,
  budget,
  season,
  onChangeCompanion,
  onChangeBudget,
  onChangeSeason,
  onNext,
}: ConditionsStepProps) {
  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-1.5 px-1 text-xs font-bold text-ink-muted">함께 가는 사람</div>
      <ChipRow options={COMPANIONS} current={companion} onChange={onChangeCompanion} />
      <div className="mb-1.5 px-1 text-xs font-bold text-ink-muted">예산 · 1인 기준</div>
      <ChipRow options={BUDGETS} current={budget} onChange={onChangeBudget} />
      <div className="mb-1.5 px-1 text-xs font-bold text-ink-muted">계절</div>
      <ChipRow options={SEASONS} current={season} onChange={onChangeSeason} />
      <Button className="mt-2" onClick={onNext}>
        다음
      </Button>
    </div>
  );
}
