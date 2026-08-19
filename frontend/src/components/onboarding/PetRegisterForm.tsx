"use client";

import { useState } from "react";
import type { PetSize } from "@/types";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { usePetStore, type PetInput } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { FormField } from "./FormField";

const SIZES: PetSize[] = ["소형견", "중형견", "대형견"];
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
    }
    if (age === "" || !Number.isFinite(ageYears) || ageYears < 0) {
      next.ageYears = "나이를 0 이상 숫자로 입력해주세요";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    return { name: name.trim(), breed: breed.trim(), weightKg, ageYears, size, emoji };
  };

  const handleSubmit = () => {
    const input = validate();
    if (!input) return;

    if (mode === "edit" && target) {
      updatePet(target.id, input);
      showToast(`${input.name}의 정보를 수정했어요`);
    } else {
      addPet(input);
      showToast(`${input.name}을(를) 등록했어요`);
    }
    onCompleted();
  };

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
      <FormField
        label="견종"
        value={breed}
        onChange={(event) => setBreed(event.target.value)}
        placeholder="골든리트리버"
        maxLength={30}
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

      <Button variant="primary" onClick={handleSubmit} className="mt-1">
        {mode === "edit" ? "수정 완료" : "등록하기"}
      </Button>
    </div>
  );
}
