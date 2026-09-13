import { create } from "zustand";
import type { Place } from "@/types";

interface OpenOptions {
  title: string;
  initialSelected: Place[];
  onDone?: (places: Place[]) => void;
}

interface SheetState {
  isOpen: boolean;
  title: string;
  selected: Place[];
  onDone: ((places: Place[]) => void) | null;
  open: (options: OpenOptions) => void;
  toggle: (place: Place) => void;
  close: () => void;
}

/** <PlacePickerSheet>의 열림 상태와 선택 세션을 담는 공용 스토어 — 여러 화면(코스 위저드·일정 추가)에서 재사용. */
export const useSheetStore = create<SheetState>((set, get) => ({
  isOpen: false,
  title: "",
  selected: [],
  onDone: null,
  open: ({ title, initialSelected, onDone }) =>
    set({ isOpen: true, title, selected: initialSelected, onDone: onDone ?? null }),
  toggle: (place) =>
    set((state) => {
      const exists = state.selected.some((item) => item.id === place.id);
      return {
        selected: exists
          ? state.selected.filter((item) => item.id !== place.id)
          : [...state.selected, place],
      };
    }),
  close: () => {
    get().onDone?.(get().selected);
    set({ isOpen: false, onDone: null });
  },
}));
