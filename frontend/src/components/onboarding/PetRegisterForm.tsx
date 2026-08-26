"use client";

import { useEffect, useRef, useState } from "react";
import type { PetSize } from "@/types";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { usePetStore } from "@/stores/usePetStore";
import type { PetInput } from "@/lib/api/pets";
import { useToastStore } from "@/stores/useToastStore";
import type { Breed } from "@/lib/breeds";
import { FormField } from "./FormField";
import { BreedField } from "./BreedField";
import { PetDeleteModal } from "./PetDeleteModal";

const SIZES: PetSize[] = ["소형견", "중형견", "대형견"];
/** 서버(`backend/src/routes/pets.ts`)와 같은 상한. 왕복 없이 즉시 알려주려고 여기서도 본다. */
const MAX_WEIGHT_KG = 200;
const MAX_AGE_YEARS = 50;
/** 프로토타입의 견종별 SVG 렌더러 대신 쓰는 아바타 후보 — TODO(step3 이후): 사진 업로드로 교체 */
const EMOJIS = ["🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐇"];

interface PetRegisterFormProps {
  mode: "create" | "edit";
  /** mode="edit"일 때 수정 대상. 없으면 등록 폼과 동일하게 빈 값으로 시작한다. */
  petId?: string;
  /** 저장 완료 후 이동 처리 — 진입점(온보딩/마이탭)마다 다르므로 페이지가 결정한다. */
  onCompleted: () => void;
}

interface FormErrors {
  name?: string;
  breed?: string;
  weightKg?: string;
  ageYears?: string;
  size?: string;
  emoji?: string;
}

/** 몸무게만 입력해도 크기가 맞춰지도록 기본값을 제안한다(사용자가 직접 바꿀 수 있다). */
function suggestSize(weightKg: number): PetSize {
  if (weightKg <= 10) return "소형견";
  if (weightKg <= 25) return "중형견";
  return "대형견";
}

/**
 * 반려동물 등록/수정 폼. 온보딩과 마이탭 두 진입점이 이 컴포넌트 하나를 공유한다(PLAN.md §4-2).
 * 페이지는 mode/petId만 넘기는 얇은 래퍼로 두고, 생성·수정 분기는 전부 여기서만 처리한다.
 */
export function PetRegisterForm({ mode, petId, onCompleted }: PetRegisterFormProps) {
  const pets = usePetStore((state) => state.pets);
  /** 목록을 아직 못 받았으면 `pets`가 비어 있는 게 "없음"이 아니라 "로딩 중"이다. */
  const petsHydrated = usePetStore((state) => state.hydrated);
  const addPet = usePetStore((state) => state.addPet);
  const updatePet = usePetStore((state) => state.updatePet);
  const showToast = useToastStore((state) => state.show);

  const target = mode === "edit" ? pets.find((pet) => pet.id === petId) ?? null : null;

  const [name, setName] = useState(target?.name ?? "");
  const [breed, setBreed] = useState(target?.breed ?? "");
  const [weight, setWeight] = useState(target ? String(target.weightKg) : "");
  const [age, setAge] = useState(target ? String(target.ageYears) : "");
  const [size, setSize] = useState<PetSize>(target?.size ?? "소형견");
  const [emoji, setEmoji] = useState(target?.emoji ?? EMOJIS[0]);
  const [sizeTouched, setSizeTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 수정 화면에 새로고침·직접 URL로 들어오면 목록보다 폼이 먼저 그려진다. useState 초기값은 그
  // 시점의 빈 목록을 붙잡고 있으므로, 대상이 도착하면 여기서 한 번 채워준다.
  const seededPetId = useRef<string | null>(null);
  useEffect(() => {
    if (!target || seededPetId.current === target.id) return;
    seededPetId.current = target.id;
    setName(target.name);
    setBreed(target.breed);
    setWeight(String(target.weightKg));
    setAge(String(target.ageYears));
    setSize(target.size);
    setEmoji(target.emoji);
  }, [target]);

  /**
   * 목록에서 고른 견종은 몸무게 추정보다 믿을 만하다 — 크기를 그 견종 기준으로 채우고
   * 이후 몸무게를 고쳐도 덮이지 않게 한다(사용자가 직접 바꾸는 건 여전히 우선).
   */
  const handleSelectBreed = (selected: Breed) => {
    // 믹스견처럼 체형이 정해지지 않는 견종은 단정하지 않는다.
    if (!selected.size) return;
    setSize(selected.size);
    setSizeTouched(true);
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    const parsed = Number(value);
    // 사용자가 크기를 직접 고르기 전까지만 몸무게에 맞춰 자동 보정한다.
    if (!sizeTouched && value !== "" && Number.isFinite(parsed) && parsed > 0) {
      setSize(suggestSize(parsed));
    }
  };

  const validate = (): PetInput | null => {
    const weightKg = Number(weight);
    const ageYears = Number(age);
    const next: FormErrors = {};

    if (!name.trim()) next.name = "이름을 입력해주세요";
    if (!breed.trim()) next.breed = "견종을 입력해주세요";
    if (weight === "" || !Number.isFinite(weightKg) || weightKg <= 0) {
      next.weightKg = "몸무게를 0보다 큰 숫자로 입력해주세요";
    } else if (weightKg > MAX_WEIGHT_KG) {
      next.weightKg = `몸무게는 ${MAX_WEIGHT_KG}kg 이하로 입력해주세요`;
    }
    if (age === "" || !Number.isFinite(ageYears) || ageYears < 0) {
      next.ageYears = "나이를 0 이상 숫자로 입력해주세요";
    } else if (ageYears > MAX_AGE_YEARS) {
      next.ageYears = `나이는 ${MAX_AGE_YEARS}살 이하로 입력해주세요`;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return { name: name.trim(), breed: breed.trim(), weightKg, ageYears, size, emoji };
  };

  const handleSubmit = async () => {
    const input = validate();
    if (!input) return;

    setPending(true);
    setFormError(null);

    const result =
      mode === "edit" && target ? await updatePet(target.id, input) : await addPet(input);
    setPending(false);

    if (!result.ok) {
      // 서버가 필드별 오류를 주면 폼에 붙이고, 그 외에는 폼 하단에 한 줄로 보여준다.
      setErrors(result.errors ?? {});
      setFormError(result.errors ? null : result.message ?? "저장에 실패했어요");
      return;
    }

    showToast(
      mode === "edit" ? `${input.name}의 정보를 수정했어요` : `${input.name} 등록을 마쳤어요`
    );
    onCompleted();
  };

  // 목록이 오기 전에 빈 폼을 보여주면 "정보가 사라진" 것처럼 보인다. 도착할 때까지 기다린다.
  if (mode === "edit" && !target && !petsHydrated) {
    return <p className="py-10 text-center text-xs text-ink-muted">불러오는 중…</p>;
  }

  // 목록은 받았는데 대상이 없다 — 지워졌거나 잘못된 petId다.
  if (mode === "edit" && !target) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-ink-muted">수정할 반려동물을 찾을 수 없어요.</p>
        <Button variant="text" className="mt-2" onClick={onCompleted}>
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <span className="mb-1 block px-0.5 text-xs font-bold text-ink-muted">아바타</span>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setEmoji(candidate)}
              className={
                candidate === emoji
                  ? "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-brand-400 bg-brand-100 text-2xl"
                  : "flex h-12 w-12 items-center justify-center rounded-xl border border-line-strong bg-card text-2xl"
              }
            >
              {candidate}
            </button>
          ))}
        </div>
      </div>

      <FormField
        label="이름"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="콩이"
        maxLength={20}
        error={errors.name}
      />
      <BreedField
        value={breed}
        onChange={setBreed}
        onSelectBreed={handleSelectBreed}
        error={errors.breed}
      />
      <FormField
        label="몸무게"
        value={weight}
        onChange={(event) => handleWeightChange(event.target.value)}
        placeholder="3"
        inputMode="decimal"
        suffix="kg"
        error={errors.weightKg}
      />
      <FormField
        label="나이"
        value={age}
        onChange={(event) => setAge(event.target.value)}
        placeholder="2"
        inputMode="numeric"
        suffix="살"
        error={errors.ageYears}
      />

      <div>
        <span className="mb-1 block px-0.5 text-xs font-bold text-ink-muted">크기</span>
        <div className="flex gap-2">
          {SIZES.map((candidate) => (
            <Tag
              key={candidate}
              active={candidate === size}
              onClick={() => {
                setSize(candidate);
                setSizeTouched(true);
              }}
            >
              {candidate}
            </Tag>
          ))}
        </div>
        <p className="mt-1 px-0.5 text-[10px] text-ink-muted">
          장소마다 동반 조건이 크기별로 다르기 때문에 꼭 확인해주세요.
        </p>
      </div>

      {formError ? <p className="px-0.5 text-[11px] text-accent-coral">{formError}</p> : null}

      <Button variant="primary" onClick={handleSubmit} disabled={pending} className="mt-1">
        {pending ? "저장 중…" : mode === "edit" ? "수정 완료" : "등록하기"}
      </Button>

      {mode === "edit" && target ? (
        <>
          <Button
            variant="text"
            className="text-accent-coral"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
          >
            삭제하기
          </Button>
          <PetDeleteModal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            petId={target.id}
            petName={target.name}
            onDeleted={onCompleted}
          />
        </>
      ) : null}
    </div>
  );
}
