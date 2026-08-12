import { create } from "zustand";
import type { Pet } from "@/types";
import { mockPets } from "@/mocks";

interface PetState {
  pets: Pet[];
  activePetIndex: number;
  activePet: () => Pet | null;
  switchActivePet: (index: number) => void;
}

// TODO(api): 반려동물 등록/수정은 아직 이 스토어에 없음 — petRegister 폼 포팅 시(다음 스텝) 추가.
export const usePetStore = create<PetState>((set, get) => ({
  pets: mockPets,
  activePetIndex: 0,
  activePet: () => get().pets[get().activePetIndex] ?? null,
  switchActivePet: (index) => set({ activePetIndex: index }),
}));
