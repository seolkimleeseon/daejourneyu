import type { Pet } from "@/types";

export interface PetFieldErrors {
  name?: string;
  breed?: string;
  weightKg?: string;
  ageYears?: string;
  size?: string;
  emoji?: string;
}

export type PetResult =
  | { ok: true; pet: Pet }
  | { ok: false; message?: string; errors?: PetFieldErrors };

/** 폼이 다루는 입력값. id·mbti는 폼에서 만들지 않는다(mbti는 퀴즈 결과로만 채워짐). */
export type PetInput = Omit<Pet, "id" | "mbti">;

async function requestPets(
  path: string,
  method: "GET" | "POST" | "PATCH",
  body?: PetInput
): Promise<Response | null> {
  try {
    return await fetch(`/api/pets${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return null;
  }
}

const NETWORK_ERROR = "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요";

/** 로그인한 사용자의 반려동물 목록. 비로그인·오류면 빈 배열로 다룬다. */
export async function fetchPets(): Promise<Pet[]> {
  const response = await requestPets("", "GET");
  if (!response?.ok) return [];

  const data = (await response.json()) as { pets: Pet[] };
  return data.pets;
}

async function toPetResult(response: Response | null): Promise<PetResult> {
  if (!response) return { ok: false, message: NETWORK_ERROR };

  if (response.ok) {
    const data = (await response.json()) as { pet: Pet };
    return { ok: true, pet: data.pet };
  }

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    errors?: PetFieldErrors;
  };
  return { ok: false, message: data.error, errors: data.errors };
}

export async function createPetRequest(input: PetInput): Promise<PetResult> {
  return toPetResult(await requestPets("", "POST", input));
}

export async function updatePetRequest(petId: string, input: PetInput): Promise<PetResult> {
  return toPetResult(await requestPets(`/${petId}`, "PATCH", input));
}
