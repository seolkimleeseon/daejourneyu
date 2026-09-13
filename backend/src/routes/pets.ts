import { Router } from "express";
import type { Pet } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { requireAuth } from "../lib/auth";

const router = Router();

const SIZES = ["소형견", "중형견", "대형견"] as const;
type PetSize = (typeof SIZES)[number];

/**
 * 아바타 후보. 프론트 `PetRegisterForm`의 EMOJIS와 같은 목록을 유지해야 한다 —
 * 한쪽만 늘리면 화면에서 고를 수 있는데 서버가 400으로 막는 상태가 된다.
 * TODO(step3 이후): 사진 업로드로 바뀌면 이 화이트리스트는 사라진다.
 */
const EMOJIS = ["🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐇"] as const;

/** 입력 상한. 폼(maxLength)만으론 API 직접 호출을 막지 못해 서버에서도 같은 기준으로 자른다. */
const MAX_NAME_LENGTH = 20;
const MAX_BREED_LENGTH = 30;
/** 세계 최대 견종도 100kg를 넘지 않는다. 오타(28 → 2800)를 걸러내는 용도. */
const MAX_WEIGHT_KG = 200;
/** 기네스 최고령견이 29살이다. */
const MAX_AGE_YEARS = 50;
/** 한 계정당 등록 한도. 목록 화면(PetSwitcher)이 감당할 수 있는 수준으로 둔다. */
const MAX_PETS_PER_USER = 10;

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
  else if (trimmedName.length > MAX_NAME_LENGTH) errors.name = `이름은 ${MAX_NAME_LENGTH}자 이내로 입력해주세요`;

  if (!trimmedBreed) errors.breed = "견종을 입력해주세요";
  else if (trimmedBreed.length > MAX_BREED_LENGTH) {
    errors.breed = `견종은 ${MAX_BREED_LENGTH}자 이내로 입력해주세요`;
  }

  if (!Number.isFinite(weight) || weight <= 0) errors.weightKg = "몸무게를 0보다 큰 숫자로 입력해주세요";
  else if (weight > MAX_WEIGHT_KG) errors.weightKg = `몸무게는 ${MAX_WEIGHT_KG}kg 이하로 입력해주세요`;

  if (!Number.isFinite(age) || age < 0) errors.ageYears = "나이를 0 이상 숫자로 입력해주세요";
  else if (age > MAX_AGE_YEARS) errors.ageYears = `나이는 ${MAX_AGE_YEARS}살 이하로 입력해주세요`;

  if (!SIZES.includes(size as PetSize)) errors.size = "크기를 선택해주세요";
  if (typeof emoji !== "string" || !EMOJIS.includes(emoji as (typeof EMOJIS)[number])) {
    errors.emoji = "아바타를 선택해주세요";
  }

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

/** 코스 추천 테마로 쓰이는 장소 카테고리. 프론트 PlaceCategory와 같은 목록을 유지한다. */
const MBTI_THEMES = ["산책", "놀이터", "맛집", "문화"] as const;
type MbtiTheme = (typeof MBTI_THEMES)[number];

/** MBTI 4글자 코드. 퀴즈(scoreAnswers)가 만들어내는 조합만 허용한다. */
const MBTI_CODE_PATTERN = /^[EI][SN][TF][JP]$/;
const MAX_TRAITS = 10;
const MAX_TRAIT_LENGTH = 20;
const MAX_MBTI_NAME_LENGTH = 40;

interface ParsedMbtiInput {
  error: string | null;
  data: { mbtiCode: string; mbtiName: string; mbtiTheme: MbtiTheme; mbtiTraits: string[] };
}

/**
 * 퀴즈 결과를 검증한다. 이름·성향 문구는 프론트 사전(lib/mbti.ts)에서 오지만,
 * API를 직접 두드릴 수 있으므로 형식은 서버에서 다시 본다.
 */
function parseMbtiInput(body: unknown): ParsedMbtiInput {
  const { code, name, theme, traits } = (body ?? {}) as Record<string, unknown>;
  const empty = { mbtiCode: "", mbtiName: "", mbtiTheme: "산책" as MbtiTheme, mbtiTraits: [] };

  if (typeof code !== "string" || !MBTI_CODE_PATTERN.test(code)) {
    return { error: "MBTI 코드가 올바르지 않아요", data: empty };
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.length > MAX_MBTI_NAME_LENGTH) {
    return { error: "MBTI 유형 이름이 올바르지 않아요", data: empty };
  }
  if (!MBTI_THEMES.includes(theme as MbtiTheme)) {
    return { error: "추천 테마가 올바르지 않아요", data: empty };
  }
  if (
    !Array.isArray(traits) ||
    traits.length > MAX_TRAITS ||
    !traits.every((t) => typeof t === "string" && t.length > 0 && t.length <= MAX_TRAIT_LENGTH)
  ) {
    return { error: "성향 태그가 올바르지 않아요", data: empty };
  }

  return {
    error: null,
    data: {
      mbtiCode: code,
      mbtiName: name.trim(),
      mbtiTheme: theme as MbtiTheme,
      mbtiTraits: traits as string[],
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

    const count = await prisma.pet.count({ where: { userId: req.userId } });
    if (count >= MAX_PETS_PER_USER) {
      return res.status(400).json({ error: `반려동물은 최대 ${MAX_PETS_PER_USER}마리까지 등록할 수 있어요` });
    }

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

// PUT /api/pets/:petId/mbti — 반려동물 MBTI 퀴즈 결과 저장. 다시 보면 덮어쓴다.
// 등록 폼(PATCH)과 분리한 이유: MBTI는 폼이 아니라 퀴즈에서만 채워지고, 폼 저장이 결과를 지우면 안 된다.
router.put(
  "/:petId/mbti",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { error, data } = parseMbtiInput(req.body);
    if (error) return res.status(400).json({ error });

    // 남의 반려동물에 결과를 심지 못하도록 소유자까지 조건에 넣는다.
    const target = await prisma.pet.findFirst({ where: { id: req.params.petId, userId: req.userId } });
    if (!target) return res.status(404).json({ error: "반려동물을 찾을 수 없어요" });

    const pet = await prisma.pet.update({ where: { id: target.id }, data });
    res.json({ pet: toPublicPet(pet) });
  })
);

// DELETE /api/pets/:petId
router.delete(
  "/:petId",
  requireAuth,
  asyncHandler(async (req, res) => {
    // PATCH와 같은 이유로 소유자까지 확인한다 — 남의 반려동물을 지울 수 없어야 한다.
    const target = await prisma.pet.findFirst({ where: { id: req.params.petId, userId: req.userId } });
    if (!target) return res.status(404).json({ error: "반려동물을 찾을 수 없어요" });

    await prisma.pet.delete({ where: { id: target.id } });
    res.status(204).end();
  })
);

export default router;
