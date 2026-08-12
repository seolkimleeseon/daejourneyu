import type { PlaceCategory } from "./place";

export type PetSize = "소형견" | "중형견" | "대형견";

export interface MbtiResult {
  code: string;
  name: string;
  /** 가장 매칭도 높은 코스 테마 — 결과 화면에서 "이 유형으로 코스 만들기" 진입점으로 쓰임 */
  theme: PlaceCategory;
  traits: string[];
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  weightKg: number;
  ageYears: number;
  size: PetSize;
  /** 아바타 대용 이모지. 프로토타입의 견종별 SVG 렌더러는 STEP2 범위 밖 — TODO(step3) */
  emoji: string;
  mbti?: MbtiResult;
}
