import type { CSSProperties } from "react";

interface TraitChipProps {
  label: string;
  delay?: number;
}

export function TraitChip({ label, delay = 0 }: TraitChipProps) {
  return (
    <span
      style={{ animationDelay: `${delay}s` } as CSSProperties}
      className="animate-fade-up rounded-xl bg-accent-purple-light px-2 py-1 text-[9px] font-medium text-accent-purple"
    >
      {label}
    </span>
  );
}
