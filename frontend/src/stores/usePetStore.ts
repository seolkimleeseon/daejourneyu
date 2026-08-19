import { create } from "zustand";
import type { Pet } from "@/types";
import {
  createPetRequest,
  fetchPets,
  updatePetRequest,
  type PetInput,
  type PetResult,
} from "@/lib/api/pets";

export type { PetInput };

interface PetState {
  pets: Pet[];
  activePetIndex: number;
  activePet: () => Pet | null;
  switchActivePet: (index: number) => void;
  /** 로그인 상태가 되면 서버 목록을 불러오고, 로그아웃되면 비운다. */
  hydrate: () => Promise<void>;
  clear: () => void;
  addPet: (input: PetInput) => Promise<PetResult>;
  updatePet: (petId: string, input: PetInput) => Promise<PetResult>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePetIndex: 0,
  activePet: () => get().pets[get().activePetIndex] ?? null,
  switchActivePet: (index) => set({ activePetIndex: index }),

  hydrate: async () => {
    const pets = await fetchPets();
    // 목록이 줄어든 경우 활성 인덱스가 범위를 벗어나지 않도록 보정한다.
    set((state) => ({ pets, activePetIndex: Math.min(state.activePetIndex, Math.max(pets.length - 1, 0)) }));
  },

  clear: () => set({ pets: [], activePetIndex: 0 }),

  addPet: async (input) => {
    const result = await createPetRequest(input);
    // 방금 등록한 반려동물을 활성으로 둔다.
    if (result.ok) set((state) => ({ pets: [...state.pets, result.pet], activePetIndex: state.pets.length }));
    return result;
  },

  updatePet: async (petId, input) => {
    const result = await updatePetRequest(petId, input);
    if (result.ok) {
      set((state) => ({
        pets: state.pets.map((pet) => (pet.id === petId ? result.pet : pet)),
      }));
    }
    return result;
  },
}));
