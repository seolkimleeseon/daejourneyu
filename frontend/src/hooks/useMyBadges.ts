import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useReviews } from "@/hooks/useReviews";
import { computeMyBadges, type Badge } from "@/lib/badges";
import { mockCourses, mockCourseSchedules } from "@/mocks";

interface MyBadges {
  badges: Badge[];
  got: Badge[];
  gotCount: number;
  total: number;
}

/**
 * 뱃지 계산에 필요한 스토어·훅 연결을 한곳에 모은다.
 * 마이탭 요약(획득분만)과 전체 목록 화면이 같은 기준을 봐야 해서 페이지마다 다시 엮지 않는다.
 */
export function useMyBadges(): MyBadges {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const pets = usePetStore((state) => state.pets);
  const activePet = usePetStore((state) => state.activePet());
  const { data: reviews = [] } = useReviews();

  // TODO(api): 코스·일정이 서버로 옮겨지면 목데이터 대신 해당 훅으로 교체한다.
  const badges = computeMyBadges({
    isLoggedIn,
    pets,
    activePet,
    courses: mockCourses,
    schedules: mockCourseSchedules,
    reviews,
  });

  const got = badges.filter((badge) => badge.got);
  return { badges, got, gotCount: got.length, total: badges.length };
}
