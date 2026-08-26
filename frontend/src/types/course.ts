import type { DaejeonDistrict, PlaceCategory } from "./place";

export type CourseSource = "ai" | "manual" | "saved";
export type Transport = "자차" | "대중교통";

export interface CourseStop {
  placeId: string;
  name: string;
  category: PlaceCategory;
  district: DaejeonDistrict;
  condition: string;
  petFriendly: boolean;
  /** 장소 사진 URL(있는 소스에서 담아온 경우만). 없으면 카테고리 이모지로 대체 표시. */
  imageUrl?: string | null;
}

export interface Course {
  id: string;
  label: string;
  /** 티켓 카드 대표 이모지. 사용자가 직접 고르지 않았으면 비어있고, 화면에서는 기본값(🐾)을 쓴다. */
  emoji?: string | null;
  /** 0 = 당일치기 */
  nights: number;
  transport: Transport;
  source: CourseSource;
  shared: boolean;
  /** 일차별 방문 장소. 당일치기 코스도 days.length === 1로 통일 */
  days: CourseStop[][];
}

export interface CourseSchedule {
  id: string;
  courseId: string;
  /** YYYY-MM-DD */
  date: string;
  festivalTitles: string[];
}
