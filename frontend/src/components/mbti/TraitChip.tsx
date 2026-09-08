interface TraitChipProps {
  label: string;
}

export function TraitChip({ label }: TraitChipProps) {
  return (
    <span className="rounded-xl bg-accent-purple-light px-2 py-1 text-[9px] font-medium text-accent-purple">
      {label}
    </span>
  );
}
