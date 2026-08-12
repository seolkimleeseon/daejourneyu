import { create } from "zustand";

interface ToastState {
  message: string | null;
  /** 같은 문구를 연속으로 띄워도 애니메이션이 다시 트리거되도록 매번 증가시키는 키 */
  key: number;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  key: 0,
  show: (message) => set((state) => ({ message, key: state.key + 1 })),
  hide: () => set({ message: null }),
}));
