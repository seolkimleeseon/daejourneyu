import { create } from "zustand";

interface MbtiResultState {
  /** 완료한 MBTI 결과 코드(예: "ENFP"). 로그인 사용자 프로필에 저장되는 걸 흉내낸 목 상태 —
   * 실제 로그인/백엔드 연동 전까지는 세션 동안만 유지된다. */
  code: string | null;
  setCode: (code: string) => void;
}

// TODO(api): 실제 로그인 붙으면 사용자 프로필의 MBTI 결과 필드로 교체.
export const useMbtiResultStore = create<MbtiResultState>((set) => ({
  code: null,
  setCode: (code) => set({ code }),
}));
