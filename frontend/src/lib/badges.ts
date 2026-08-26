import type { Course, CourseSchedule, Pet, Review } from "@/types";

/**
 * 뱃지 계열. 앱에서 할 수 있는 일의 갈래와 맞춘다 — 뱃지가 늘어나면 이 값으로 묶어 보여준다.
 * 계열이 늘어나면 BADGE_CATEGORIES의 순서도 함께 맞춘다(화면 노출 순서가 이 배열이다).
 */
export type BadgeCategory = "반려동물" | "코스" | "여정" | "기록";

export const BADGE_CATEGORIES: BadgeCategory[] = ["반려동물", "코스", "여정", "기록"];

export interface Badge {
  emoji: string;
  name: string;
  category: BadgeCategory;
  /** 그리드 타일에 들어가는 짧은 라벨. 한 줄을 넘기지 않는다. */
  description: string;
  /** 아직 못 받은 뱃지에 보여줄 획득 조건. 그 자체로 할 일이 되므로 문장으로 쓴다. */
  how: string;
  got: boolean;
}

interface ComputeBadgesInput {
  isLoggedIn: boolean;
  pets: Pet[];
  activePet: Pet | null;
  courses: Course[];
  schedules: CourseSchedule[];
  reviews: Review[];
}

export function computeMyBadges({
  isLoggedIn,
  pets,
  activePet,
  courses,
  schedules,
  reviews,
}: ComputeBadgesInput): Badge[] {
  return [
    {
      emoji: "🐾",
      name: "첫 반려인",
      category: "반려동물",
      description: "가입 완료",
      how: "대저니유에 가입하면 바로 받아요",
      got: isLoggedIn,
    },
    {
      emoji: "✨",
      name: "MBTI 진단",
      category: "반려동물",
      description: "성향 완료",
      how: "반려동물 MBTI 퀴즈를 끝까지 풀어보세요",
      got: !!activePet?.mbti,
    },
    {
      emoji: "🗺️",
      name: "코스 메이커",
      category: "코스",
      description: "직접 코스 짓기",
      how: "내 여정에서 코스를 직접 만들어보세요",
      got: courses.some((course) => course.source === "manual"),
    },
    {
      emoji: "📅",
      name: "계획러",
      category: "여정",
      description: "일정 등록",
      how: "코스에 날짜를 붙여 내 여정에 등록해보세요",
      got: schedules.length > 0,
    },
    {
      emoji: "🎪",
      name: "축제 헌터",
      category: "여정",
      description: "축제 담기",
      how: "일정에 대전에서 열리는 축제를 담아보세요",
      got: schedules.some((schedule) => schedule.festivalTitles.length > 0),
    },
    {
      emoji: "✍️",
      name: "첫 후기",
      category: "기록",
      description: "후기 작성",
      how: "다녀온 장소에 후기를 남겨보세요",
      got: reviews.some((review) => review.isMine),
    },
    {
      emoji: "🧭",
      name: "코스 스타",
      category: "코스",
      description: "둘러보기 공유",
      how: "만든 코스를 둘러보기에 공유해보세요",
      got: courses.some((course) => course.shared),
    },
    {
      emoji: "🐶",
      name: "멍친구",
      category: "반려동물",
      description: "2마리+",
      how: "반려동물을 두 마리 이상 등록해보세요",
      got: pets.length >= 2,
    },
  ];
}
