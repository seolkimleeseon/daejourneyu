"use client";

import { useRef, useState } from "react";
import type { Breed } from "@/lib/breeds";
import { searchBreeds } from "@/lib/breeds";
import { FormField } from "./FormField";

interface BreedFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** 목록에서 고른 경우에만 호출된다 — 직접 타이핑한 값으로는 크기를 단정하지 않는다. */
  onSelectBreed: (breed: Breed) => void;
  error?: string;
}

/**
 * 견종 입력 + 자동완성. 목록에 없는 견종(믹스·교배견·희귀종)도 그대로 저장할 수 있어야 하므로
 * 후보는 제안만 하고 입력 자체를 막지 않는다.
 */
export function BreedField({ value, onChange, onSelectBreed, error }: BreedFieldProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  /** 방금 고른 값이 다시 후보를 띄우지 않도록 표시해둔다. */
  const justPicked = useRef(false);

  const matches = open && !justPicked.current ? searchBreeds(value) : [];

  const pick = (breed: Breed) => {
    justPicked.current = true;
    onChange(breed.name);
    onSelectBreed(breed);
    setOpen(false);
  };

  const handleChange = (next: string) => {
    justPicked.current = false;
    setHighlight(0);
    setOpen(true);
    onChange(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (matches.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) => (current - 1 + matches.length) % matches.length);
    } else if (event.key === "Enter") {
      // 폼 제출로 새지 않게 막고 후보 선택으로 쓴다.
      event.preventDefault();
      pick(matches[highlight]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div>
      {/* 후보 목록은 입력칸 바로 아래에 붙어야 하므로, 안내 문구는 이 relative 바깥에 둔다. */}
      <div className="relative">
        <FormField
          label="견종"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setOpen(true)}
          // blur로 닫으면 후보 탭이 먹히지 않는다. 후보 쪽에서 mousedown을 막고 여기선 늦게 닫는다.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder="골든리트리버"
          maxLength={30}
          error={error}
          autoComplete="off"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-autocomplete="list"
        />

        {matches.length > 0 ? (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-line-strong bg-card shadow-lg"
          >
            {matches.map((breed, index) => (
              <li key={breed.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(breed)}
                  className={
                    "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-ink " +
                    (index === highlight ? "bg-brand-100" : "bg-card")
                  }
                >
                  <span>{breed.name}</span>
                  {breed.size ? (
                    <span className="shrink-0 text-[10px] text-ink-muted">{breed.size}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="mt-1 px-0.5 text-[10px] text-ink-muted">
        목록에 없으면 직접 입력해도 괜찮아요.
      </p>
    </div>
  );
}
