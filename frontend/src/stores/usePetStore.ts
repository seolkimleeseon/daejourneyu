import { create } from "zustand";
import type { MbtiResult, Pet } from "@/types";
import {
  createPetRequest,
  deletePetRequest,
  fetchPets,
  savePetMbtiApi,
  updatePetRequest,
  type PetDeleteResult,
  type PetInput,
  type PetResult,
} from "@/lib/api/pets";

export type { PetInput };

interface PetState {
  pets: Pet[];
  activePetIndex: number;
  /**
   * 서버 목록을 한 번이라도 받아왔는지. `pets`가 빈 배열인 이유가 "아직 로딩 중"인지
   * "정말 등록된 게 없음"인지 구분하려면 이 값이 필요하다 — 수정 화면이 빈 폼을 띄우지 않도록.
   */
  hydrated: boolean;
  activePet: () => Pet | null;
  switchActivePet: (index: number) => void;
  /** 로그인 상태가 되면 서버 목록을 불러오고, 로그아웃되면 비운다. */
  hydrate: () => Promise<void>;
  clear: () => void;
  addPet: (input: PetInput) => Promise<PetResult>;
  updatePet: (petId: string, input: PetInput) => Promise<PetResult>;
  removePet: (petId: string) => Promise<PetDeleteResult>;
  /** MBTI 퀴즈 결과를 해당 반려동물에 저장한다. */
  saveMbti: (petId: string, mbti: MbtiResult) => Promise<PetResult>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  activePetIndex: 0,
  hydrated: false,
  activePet: () => get().pets[get().activePetIndex] ?? null,
  switchActivePet: (index) => set({ activePetIndex: index }),

  hydrate: async () => {
    const pets = await fetchPets();
    // 목록이 줄어든 경우 활성 인덱스가 범위를 벗어나지 않도록 보정한다.
    set((state) => ({
      pets,
      activePetIndex: Math.min(state.activePetIndex, Math.max(pets.length - 1, 0)),
      hydrated: true,
    }));
  },

  clear: () => set({ pets: [], activePetIndex: 0, hydrated: false }),

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

  saveMbti: async (petId, mbti) => {
    const result = await savePetMbtiApi(petId, mbti);
    if (result.ok) {
      set((state) => ({
        pets: state.pets.map((pet) => (pet.id === petId ? result.pet : pet)),
      }));
    }
    return result;
  },

  removePet: async (petId) => {
    const result = await deletePetRequest(petId);
    if (result.ok) {
      set((state) => {
        const pets = state.pets.filter((pet) => pet.id !== petId);
        // 지운 게 활성 개체였거나 그보다 앞이면 인덱스가 밀린다. 범위 밖으로 나가지 않게 자른다.
        return { pets, activePetIndex: Math.min(state.activePetIndex, Math.max(pets.length - 1, 0)) };
      });
    }
    return result;
  },
}));
