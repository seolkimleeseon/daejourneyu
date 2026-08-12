import type { Course, CourseSchedule, Pet, Review } from "@/types";

export interface Badge {
  emoji: string;
  name: string;
  description: string;
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
    { emoji: "🐾", name: "첫 반려인", description: "가입 완료", got: isLoggedIn },
    { emoji: "✨", name: "MBTI 진단", description: "성향 완료", got: !!activePet?.mbti },
    {
      emoji: "🗺️",
      name: "코스 메이커",
      description: "직접 코스 짓기",
      got: courses.some((course) => course.source === "manual"),
    },
    { emoji: "📅", name: "계획러", description: "일정 등록", got: schedules.length > 0 },
    {
      emoji: "🎪",
      name: "축제 헌터",
      description: "축제 담기",
      got: schedules.some((schedule) => schedule.festivalTitles.length > 0),
    },
    {
      emoji: "✍️",
      name: "첫 후기",
      description: "후기 작성",
      got: reviews.some((review) => review.isMine),
    },
    {
      emoji: "🧭",
      name: "코스 스타",
      description: "둘러보기 공유",
      got: courses.some((course) => course.shared),
    },
    { emoji: "🐶", name: "멍친구", description: "2마리+", got: pets.length >= 2 },
  ];
}
