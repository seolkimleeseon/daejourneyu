"use client";

import { useEffect, useRef, useState } from "react";
import type { Pet } from "@/types";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { cn } from "@/lib/cn";

interface PetSwitcherProps {
  pets: Pet[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onAddPet: () => void;
}

/**
 * 여권 카드 아래 활성 반려동물 전환 줄.
 * 한 마리면 고를 게 없으니 추가 버튼만 두고, 두 마리 이상부터 드롭다운으로 접는다 —
 * 칩을 그대로 늘어놓으면 마리 수가 늘수록 줄바꿈되면서 카드 아래가 계속 밀려난다.
 */
export function PetSwitcher({ pets, activeIndex, onSwitch, onAddPet }: PetSwitcherProps) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const multiple = pets.length > 1;

  // 마지막 한 마리만 남으면 드롭다운 자체가 사라지므로 열린 상태도 같이 정리한다.
  useEffect(() => {
    if (!multiple) setOpen(false);
  }, [multiple]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if ("Escape" === event.key) setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (0 === pets.length) return null;

  // 삭제 직후처럼 인덱스가 잠깐 범위를 벗어날 수 있어 첫 마리로 되돌린다.
  const activePet = pets[activeIndex] ?? pets[0];

  const handleSelect = (index: number) => {
    onSwitch(index);
    setOpen(false);
  };

  return (
    <div className="flex items-stretch gap-2 py-3">
      {multiple ? (
        <div ref={selectRef} className="relative flex-1">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-xl border bg-brand-100 px-3 py-2.5 text-xs font-bold text-brand-700 transition-colors",
              open ? "border-brand" : "border-brand-300"
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Emoji3D emoji={activePet.emoji} size={16} shadow={false} />
              <span className="truncate">{activePet.name}</span>
            </span>
            <span
              aria-hidden
              className={cn("shrink-0 text-[10px] transition-transform", open && "rotate-180")}
            >
              ▾
            </span>
          </button>

          {open ? (
            <ul
              role="listbox"
              aria-label="반려동물 선택"
              className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-line bg-card shadow-lg"
            >
              {pets.map((pet, index) => (
                <li key={pet.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => handleSelect(index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 border-b border-line px-3 py-2.5 text-left text-xs font-semibold last:border-b-0",
                      index === activeIndex ? "bg-brand-100 text-brand-700" : "text-ink"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Emoji3D emoji={pet.emoji} size={16} shadow={false} />
                      <span className="truncate">{pet.name}</span>
                    </span>
                    {index === activeIndex ? (
                      <span aria-hidden className="shrink-0 text-[11px]">
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        aria-label="반려동물 추가"
        onClick={onAddPet}
        className={cn(
          "shrink-0 rounded-xl border border-line-strong bg-card px-3 py-2.5 text-xs font-semibold text-ink-muted transition-colors",
          !multiple && "flex-1"
        )}
      >
        {multiple ? "+ 추가" : "+ 반려동물 추가"}
      </button>
    </div>
  );
}
