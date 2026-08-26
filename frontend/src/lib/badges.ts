import type { Course, CourseSchedule, Pet, Review } from "@/types";

/**
 * 뱃지 식별자. `name`은 화면에 보이는 카피라서 언제든 바뀔 수 있으므로 key·정렬·저장에는
 * 이 값을 쓴다. 뱃지를 추가할 때 여기에 먼저 넣으면 목록 쪽 누락을 타입이 잡아준다.
 */
export type BadgeId =
  | "first-owner"
  | "pet-mbti"
  | "dog-friend"
  | "course-maker"
  | "course-star"
  | "planner"
  | "festival-hunter"
  | "first-review";

/**
 * 뱃지 계열. 앱에서 할 수 있는 일의 갈래와 맞춘다.
 * 전체 목록 화면(/my/badges)의 섹션 순서가 곧 이 배열의 순서다.
 */
export type BadgeCategory = "반려동물" | "코스" | "여정" | "기록";

export const BADGE_CATEGORIES: BadgeCategory[] = ["반려동물", "코스", "여정", "기록"];

export interface Badge {
  id: BadgeId;
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

/**
 * 배열 순서 = 전체 목록 화면의 카탈로그 순서(계열별로 이웃하게 둔다).
 * 마이탭 요약 그리드는 이 순서를 그대로 쓰지 않고 획득분을 앞으로 당겨 정렬한다 — 요약은
 * "내가 어디까지 왔나"를 답하는 자리라, 뱃지가 늘어 앞 8칸만 남더라도 모은 것이 먼저 보여야 한다.
 */
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
      id: "first-owner",
      emoji: "🐾",
      name: "첫 반려인",
      category: "반려동물",
      description: "가입 완료",
      how: "대저니유에 가입하면 바로 받아요",
      got: isLoggedIn,
    },
    {
      id: "pet-mbti",
      emoji: "✨",
      name: "MBTI 진단",
      category: "반려동물",
      description: "성향 완료",
      how: "반려동물 MBTI 퀴즈를 끝까지 풀어보세요",
      got: !!activePet?.mbti,
    },
    {
      id: "dog-friend",
      emoji: "🐶",
      name: "멍친구",
      category: "반려동물",
      description: "2마리+",
      how: "반려동물을 두 마리 이상 등록해보세요",
      got: pets.length >= 2,
    },
    {
      id: "course-maker",
      emoji: "🗺️",
      name: "코스 메이커",
      category: "코스",
      description: "직접 코스 짓기",
      how: "내 여정에서 코스를 직접 만들어보세요",
      got: courses.some((course) => course.source === "manual"),
    },
    {
      id: "course-star",
      emoji: "🧭",
      name: "코스 스타",
      category: "코스",
      description: "둘러보기 공유",
      how: "만든 코스를 둘러보기에 공유해보세요",
      got: courses.some((course) => course.shared),
    },
    {
      id: "planner",
      emoji: "📅",
      name: "계획러",
      category: "여정",
      description: "일정 등록",
      how: "코스에 날짜를 붙여 내 여정에 등록해보세요",
      got: schedules.length > 0,
    },
    {
      id: "festival-hunter",
      emoji: "🎪",
      name: "축제 헌터",
      category: "여정",
      description: "축제 담기",
      how: "일정에 대전에서 열리는 축제를 담아보세요",
      got: schedules.some((schedule) => schedule.festivalTitles.length > 0),
    },
    {
      id: "first-review",
      emoji: "✍️",
      name: "첫 후기",
      category: "기록",
      description: "후기 작성",
      how: "다녀온 장소에 후기를 남겨보세요",
      got: reviews.some((review) => review.isMine),
    },
  ];
}

export interface BadgeGroup {
  category: BadgeCategory;
  badges: Badge[];
  gotCount: number;
}

/**
 * 전체 목록 화면용 계열 묶음. 뱃지가 하나도 없는 계열은 빈 섹션 헤더만 남으므로 제외한다.
 * 계열 안에서는 정렬하지 않는다 — 카탈로그는 매번 같은 자리에 있어야 눈에 익는다.
 */
export function groupBadgesByCategory(badges: Badge[]): BadgeGroup[] {
  return BADGE_CATEGORIES.map((category) => {
    const inCategory = badges.filter((badge) => badge.category === category);
    return {
      category,
      badges: inCategory,
      gotCount: inCategory.filter((badge) => badge.got).length,
    };
  }).filter((group) => group.badges.length > 0);
}
