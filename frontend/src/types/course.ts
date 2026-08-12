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
}

export interface Course {
  id: string;
  label: string;
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
