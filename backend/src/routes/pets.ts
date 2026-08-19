import { Router } from "express";
import type { Pet } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../lib/auth";

const router = Router();

const SIZES = ["소형견", "중형견", "대형견"] as const;
type PetSize = (typeof SIZES)[number];

/** 프론트 Pet 타입(src/types/pet.ts) 모양. mbti는 컬럼 4개를 중첩 객체로 묶어 돌려준다. */
interface PublicPet {
  id: string;
  name: string;
  breed: string;
  weightKg: number;
  ageYears: number;
  size: PetSize;
  emoji: string;
  mbti?: {
    code: string;
    name: string;
    theme: string;
    traits: string[];
  };
}

function toPublicPet(pet: Pet): PublicPet {
  return {
    id: pet.id,
    name: pet.name,
    breed: pet.breed,
    weightKg: pet.weightKg,
    ageYears: pet.ageYears,
    size: pet.size as PetSize,
    emoji: pet.emoji,
    // 퀴즈를 아직 안 봤으면 code가 없다 — 그때는 mbti 자체를 내보내지 않는다.
    ...(pet.mbtiCode && pet.mbtiName && pet.mbtiTheme
      ? {
          mbti: {
            code: pet.mbtiCode,
            name: pet.mbtiName,
            theme: pet.mbtiTheme,
            traits: pet.mbtiTraits,
          },
        }
      : {}),
  };
}

interface ParsedPetInput {
  errors: Record<string, string>;
  data: {
    name: string;
    breed: string;
    weightKg: number;
    ageYears: number;
    size: PetSize;
    emoji: string;
  };
}

/** 등록 폼과 같은 규칙으로 검증한다 — 폼 검증은 우회될 수 있으므로 서버에서 다시 본다. */
function parsePetInput(body: unknown): ParsedPetInput {
  const { name, breed, weightKg, ageYears, size, emoji } = (body ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedBreed = typeof breed === "string" ? breed.trim() : "";
  const weight = Number(weightKg);
  const age = Number(ageYears);

  if (!trimmedName) errors.name = "이름을 입력해주세요";
  if (!trimmedBreed) errors.breed = "견종을 입력해주세요";
  if (!Number.isFinite(weight) || weight <= 0) errors.weightKg = "몸무게를 0보다 큰 숫자로 입력해주세요";
  if (!Number.isFinite(age) || age < 0) errors.ageYears = "나이를 0 이상 숫자로 입력해주세요";
  if (!SIZES.includes(size as PetSize)) errors.size = "크기를 선택해주세요";
  if (typeof emoji !== "string" || !emoji) errors.emoji = "아바타를 선택해주세요";

  return {
    errors,
    data: {
      name: trimmedName,
      breed: trimmedBreed,
      weightKg: weight,
      ageYears: Math.trunc(age),
      size: size as PetSize,
      emoji: emoji as string,
    },
  };
}

// GET /api/pets — 로그인한 사용자의 반려동물 목록(등록 순)
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const pets = await prisma.pet.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json({ pets: pets.map(toPublicPet) });
  })
);

// POST /api/pets
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { errors, data } = parsePetInput(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    const pet = await prisma.pet.create({ data: { ...data, userId: req.userId! } });
    res.status(201).json({ pet: toPublicPet(pet) });
  })
);

// PATCH /api/pets/:petId
router.patch(
  "/:petId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { errors, data } = parsePetInput(req.body);
    if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

    // 남의 반려동물을 수정하지 못하도록 소유자까지 조건에 넣는다.
    const target = await prisma.pet.findFirst({ where: { id: req.params.petId, userId: req.userId } });
    if (!target) return res.status(404).json({ error: "반려동물을 찾을 수 없어요" });

    const pet = await prisma.pet.update({ where: { id: target.id }, data });
    res.json({ pet: toPublicPet(pet) });
  })
);

export default router;
