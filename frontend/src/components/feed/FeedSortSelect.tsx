"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface FeedSortSelectProps<T extends string> {
  value: T;
  options: SortOption<T>[];
  onChange: (value: T) => void;
}

/**
 * 목록 바로 위 건수 줄 오른쪽 끝에 붙는 정렬 드롭다운. 탭마다 선택지가 달라 옵션을 주입받는다.
 *
 * 네이티브 `<select>`를 쓰면 열었을 때 OS 기본 회색 목록이 그대로 떠서 앱 톤과 따로 논다(스타일을
 * 먹일 수 없는 영역이다). 그래서 버튼 + 팝오버로 직접 그리고, 대신 네이티브가 공짜로 주던
 * 바깥 클릭/Esc 닫기와 listbox 역할은 손으로 채워 넣었다.
 */
export function FeedSortSelect<T extends string>({
  value,
  options,
  onChange,
}: FeedSortSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if ("Escape" === event.key) setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="정렬 기준"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors",
          open
            ? "border-brand-300 bg-brand-100 text-brand-700"
            : "border-brand-100 bg-brand-50 text-brand-700"
        )}
      >
        {current?.label}
        <span
          aria-hidden
          className={cn("text-[8px] transition-transform", open ? "rotate-180" : undefined)}
        >
          ▼
        </span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="정렬 기준"
          className="absolute right-0 top-full z-20 mt-1.5 min-w-[7.5rem] overflow-hidden rounded-xl border border-line bg-card shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs transition-colors",
                    selected ? "bg-brand-50 font-bold text-brand-700" : "bg-card text-ink"
                  )}
                >
                  {option.label}
                  {selected ? <span aria-hidden className="text-[10px]">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
