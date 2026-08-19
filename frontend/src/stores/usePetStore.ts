import { create } from "zustand";
import type { Pet } from "@/types";
import { mockPets } from "@/mocks";

/** 등록/수정 폼이 다루는 입력값. id·mbti는 폼에서 만들지 않는다(mbti는 퀴즈 결과로만 채워짐). */
export type PetInput = Omit<Pet, "id" | "mbti">;

interface PetState {
  pets: Pet[];
  activePetIndex: number;
  activePet: () => Pet | null;
  switchActivePet: (index: number) => void;
  /** 등록 후 방금 추가한 반려동물을 활성으로 둔다. */
  addPet: (input: PetInput) => void;
  updatePet: (petId: string, input: PetInput) => void;
}

// TODO(api): 등록/수정을 POST·PATCH /api/pets 로 교체. 지금은 클라이언트 상태로만 유지한다.
export const usePetStore = create<PetState>((set, get) => ({
  pets: mockPets,
  activePetIndex: 0,
  activePet: () => get().pets[get().activePetIndex] ?? null,
  switchActivePet: (index) => set({ activePetIndex: index }),
  addPet: (input) =>
    set((state) => {
      const pets = [...state.pets, { ...input, id: `pet-${Date.now()}` }];
      return { pets, activePetIndex: pets.length - 1 };
    }),
  updatePet: (petId, input) =>
    set((state) => ({
      pets: state.pets.map((pet) => (pet.id === petId ? { ...pet, ...input } : pet)),
    })),
}));
