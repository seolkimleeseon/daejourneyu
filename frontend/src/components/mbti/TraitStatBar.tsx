interface TraitStatBarProps {
  label: string;
  /** 1~5 */
  value: number;
}

/** MBTI 결과의 "성향 그래프" — 사교성/탐험성/표현력/루틴(또는 자유도)을 막대로 보여준다. */
export function TraitStatBar({ label, value }: TraitStatBarProps) {
  const percent = (Math.max(1, Math.min(5, value)) / 5) * 100;
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="w-12 shrink-0 text-left text-[10px] font-semibold text-ink-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent-purple" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
