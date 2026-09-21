import { useMemo } from "react";
import type { Course, CourseSchedule } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useReviews } from "@/hooks/useReviews";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import { useMyPosts } from "@/hooks/usePosts";
import { usePlaces } from "@/hooks/usePlaces";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import {
  computeMyBadges,
  nearBadgeMessage,
  pickNearestBadge,
  todayString,
  type Badge,
  type BadgeInput,
} from "@/lib/badges";

const EMPTY_COURSES: Course[] = [];
const EMPTY_SCHEDULES: CourseSchedule[] = [];

interface MyBadges {
  badges: Badge[];
  got: Badge[];
  gotCount: number;
  total: number;
  /** 마이탭 '남은 거리' 한 줄에 띄울 뱃지. 코앞인 게 없으면 null이고 그때는 줄을 숨긴다. */
  nearest: Badge | null;
  /** 그 뱃지를 두고 할 말. nearest가 null이면 빈 문자열 */
  nearestMessage: string;
  /**
   * 세어야 할 데이터(코스·후기·글·도움돼요)를 다 받았는지. 받는 사이에는 값이 계속 바뀌므로(1/44 → 12/44)
   * 화면은 이 값이 true가 되기 전엔 숫자를 그리지 않고 자리만 잡아둔다. 비로그인은 셀 게 없어 바로 true다.
   */
  ready: boolean;
}

/**
 * 뱃지 계산에 필요한 스토어·훅 연결을 한곳에 모은다.
 * 마이탭 요약과 전체 목록 화면이 같은 기준을 봐야 해서 페이지마다 다시 엮지 않는다.
 */
export function useMyBadges(): MyBadges {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const pets = usePetStore((state) => state.pets);
  const activePet = usePetStore((state) => state.activePet());
  const hydrated = useAuthStore((state) => state.hydrated);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews();
  // 뱃지가 보는 건 내 글이다(받은 담기 합계). 전체 목록은 서버 페이지 단위로 바뀌어 여기서 못 쓴다.
  const { data: posts, isLoading: postsLoading } = useMyPosts("recent", isLoggedIn);
  const { data: articleLikes, isLoading: likesLoading } = useArticleLikes();
  // 취향 계열(소형견 전용·전 견종)은 CourseStop에 없는 조건을 Place에서 찾아야 한다.
  const { data: places = [], isLoading: placesLoading } = usePlaces();
  // 마이탭 진입이 SCHEDULE 탭을 거치지 않을 수 있으므로(딥링크 등) 여기서도 직접 동기화한다.
  useSyncCoursesFromApi();
  const storeCourses = useCourseStore((state) => state.courses);
  const storeSchedules = useCourseStore((state) => state.schedules);
  const hasSynced = useCourseStore((state) => state.hasSynced);
  // 스토어의 courses 초기값은 화면을 바로 그리려는 목데이터(mockCourses)다. 서버 목록을 받기 전이나
  // 비로그인 상태에서 그걸 세면 게스트에게 "코스를 1개 만들었어요" 같은 가짜 기록이 뜬다.
  const counted = isLoggedIn && hasSynced;

  // 반려동물별로 센다. 코스가 어느 반려동물과 만든 건지(petId)를 알면 그 반려동물 몫만 세고,
  // 모르는 코스(반려동물 도입 전·담기 사본)는 모든 반려동물에게 세어 준다.
  const petId = activePet?.id ?? null;
  const courses = useMemo(
    () =>
      counted
        ? storeCourses.filter((course) => !course.petId || petId === null || course.petId === petId)
        : EMPTY_COURSES,
    [counted, storeCourses, petId]
  );
  const schedules = useMemo(() => {
    if (!counted) return EMPTY_SCHEDULES;
    const ids = new Set(courses.map((course) => course.id));
    return storeSchedules.filter((schedule) => ids.has(schedule.courseId));
  }, [counted, storeSchedules, courses]);
  const articleLikeCount = isLoggedIn ? articleLikes?.likedIds.length ?? 0 : 0;

  const input = useMemo<BadgeInput>(
    () => ({
      isLoggedIn,
      pets,
      activePet,
      courses,
      schedules,
      reviews,
      posts,
      places,
      articleLikeCount,
      today: todayString(),
    }),
    [isLoggedIn, pets, activePet, courses, schedules, reviews, posts, places, articleLikeCount]
  );

  const badges = useMemo(() => computeMyBadges(input), [input]);
  const nearest = useMemo(() => pickNearestBadge(badges), [badges]);

  const got = badges.filter((badge) => badge.got);
  return {
    badges,
    got,
    gotCount: got.length,
    total: badges.length,
    nearest,
    nearestMessage: nearest ? nearBadgeMessage(nearest, input) : "",
    ready: hydrated && (!isLoggedIn || (counted && !reviewsLoading && !postsLoading && !likesLoading && !placesLoading)),
  };
}
