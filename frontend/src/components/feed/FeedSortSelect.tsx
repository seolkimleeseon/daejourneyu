"use client";

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface FeedSortSelectProps<T extends string> {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
}

/** 탭 줄 오른쪽 끝에 붙는 정렬 드롭다운. 탭마다 선택지가 달라 옵션을 주입받는다. */
export function FeedSortSelect<T extends string>({
  value,
  options,
  onChange,
}: FeedSortSelectProps<T>) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      aria-label="정렬 기준"
      className="ml-auto rounded-lg border border-line-strong bg-card px-2 py-1.5 text-[11px] text-ink-muted"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
