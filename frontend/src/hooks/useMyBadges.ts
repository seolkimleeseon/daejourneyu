import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useReviews } from "@/hooks/useReviews";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { computeMyBadges, type Badge } from "@/lib/badges";

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
  // 마이탭 진입이 SCHEDULE 탭을 거치지 않을 수 있으므로(딥링크 등) 여기서도 직접 동기화한다.
  useSyncCoursesFromApi();
  const courses = useCourseStore((state) => state.courses);
  const schedules = useCourseStore((state) => state.schedules);

  const badges = computeMyBadges({
    isLoggedIn,
    pets,
    activePet,
    courses,
    schedules,
    reviews,
  });

  const got = badges.filter((badge) => badge.got);
  return { badges, got, gotCount: got.length, total: badges.length };
}
