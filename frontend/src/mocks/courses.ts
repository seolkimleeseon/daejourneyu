import type { Course, CourseSchedule, CourseStop } from "@/types";

const stop = (
  placeId: string,
  name: string,
  category: CourseStop["category"],
  district: CourseStop["district"],
  condition: string,
  petFriendly = true
): CourseStop => ({ placeId, name, category, district, condition, petFriendly });

export const mockCourses: Course[] = [
  {
    id: "course-1",
    label: "콩이랑 유성 나들이",
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: true,
    days: [
      [
        stop("place-1", "한밭수목원", "산책", "서구", "전 견종 · 목줄 필수"),
        stop("place-4", "유성 반려동물 놀이터", "놀이터", "유성구", "대형견 구역 분리"),
        stop("place-5", "댕댕 베이커리", "맛집", "유성구", "실내 동반 가능"),
      ],
    ],
  },
  {
    id: "course-2",
    label: "AI 추천 · 산책형 코스",
    nights: 1,
    transport: "대중교통",
    source: "ai",
    shared: false,
    days: [
      [stop("place-2", "계족산 황톳길", "산책", "대덕구", "전 견종 · 배변봉투 지참")],
      [stop("place-3", "대청호 오백리길", "산책", "동구", "전 견종 · 목줄 필수")],
    ],
  },
];

export const mockCourseSchedules: CourseSchedule[] = [
  {
    id: "schedule-1",
    courseId: "course-1",
    date: "2026-08-23",
    festivalTitles: ["유성 반려동물 마켓"],
  },
];
