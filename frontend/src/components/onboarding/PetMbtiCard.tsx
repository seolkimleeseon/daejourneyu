"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TraitChip } from "@/components/mbti/TraitChip";
import { ThemeBar } from "@/components/mbti/ThemeBar";
import { usePetStore } from "@/stores/usePetStore";
import { resolveMbtiType, type CourseTheme } from "@/lib/mbti";
import type { Pet } from "@/types";

/** MBTI 검사(= 코스 위저드의 첫 단계). 재검사는 인트로부터 다시 시작해야 하므로 quick을 붙이지 않는다. */
const MBTI_QUIZ_HREF = "/schedule/course/new/mbti";

interface PetMbtiCardProps {
  pet: Pet;
}

/**
 * 반려동물 정보 수정 화면의 '여행 유형' 칸.
 *
 * MBTI는 이 화면이 고치는 값(이름·견종·몸무게…)과 성격이 다르다 — 폼에 입력란으로 넣을 수 있는
 * 게 아니라 검사를 다시 해야 바뀌는 값이다. 그래서 입력 필드가 아니라 결과를 열어보는 버튼 하나로
 * 두고, 실제 내용은 모달이 답한다. 여권 카드에는 코드(ABCD)만 찍히기 때문에 "그래서 무슨
 * 유형인데?"를 확인할 곳이 지금까지 없었다.
 *
 * 검사 결과는 **활성(대표) 반려동물**에 저장되므로(코스 위저드의 persistMbti), 다른 개체를
 * 수정하다 재검사로 넘어가면 대표부터 이 개체로 바꿔놓고 보낸다. 안 그러면 방금 본 개체가 아니라
 * 대표 개체의 유형이 덮인다.
 */
export function PetMbtiCard({ pet }: PetMbtiCardProps) {
  const router = useRouter();
  const pets = usePetStore((state) => state.pets);
  const activePetIndex = usePetStore((state) => state.activePetIndex);
  const switchActivePet = usePetStore((state) => state.switchActivePet);
  const [open, setOpen] = useState(false);

  const goQuiz = () => {
    const index = pets.findIndex((candidate) => candidate.id === pet.id);
    if (-1 !== index && index !== activePetIndex) switchActivePet(index);
    setOpen(false);
    router.push(MBTI_QUIZ_HREF);
  };

  const type = pet.mbti ? resolveMbtiType(pet.mbti.code) : null;
  const sortedThemes = type
    ? (Object.entries(type.theme) as [CourseTheme, number][]).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div>
      <span className="mb-1 block px-0.5 text-xs font-bold text-ink-muted">여행 유형</span>

      {type ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-brand-300 bg-brand-100 px-3.5 py-3 text-left active:opacity-60"
        >
          <span className="text-2xl">{type.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-accent-purple">{type.code}</span>
            <span className="block truncate text-xs font-bold text-ink">{type.name}</span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-brand-700">결과 보기 ›</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={goQuiz}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-line-strong bg-card px-3.5 py-3 text-left active:opacity-60"
        >
          <span className="text-2xl">✨</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink">아직 검사하지 않았어요</span>
            <span className="block text-[11px] text-ink-muted">
              12문항으로 {pet.name}의 여행 성향을 알아봐요
            </span>
          </span>
          <span className="shrink-0 text-[11px] font-bold text-brand-700">검사하기 ›</span>
        </button>
      )}

      <Modal
        open={open && null !== type}
        onClose={() => setOpen(false)}
        title={type ? `${type.code} · ${type.name}` : ""}
        widthClass="w-[320px]"
      >
        {type ? (
          <>
            <div className="mx-auto -mt-1 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">
              {type.emoji}
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">{type.desc}</p>

            <div className="flex flex-wrap justify-center gap-1">
              {type.traits.map((trait) => (
                <TraitChip key={trait} label={trait} />
              ))}
            </div>

            <div className="mt-1 text-left">
              <div className="mb-1 text-[11px] font-bold text-ink-muted">맞춤 코스 테마</div>
              {sortedThemes.map(([theme, percent]) => (
                <ThemeBar key={theme} theme={theme} percent={percent} />
              ))}
            </div>

            <Button variant="secondary" onClick={goQuiz}>
              🔄 다시 검사하기
            </Button>
            <Button variant="text" onClick={() => setOpen(false)}>
              닫기
            </Button>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
