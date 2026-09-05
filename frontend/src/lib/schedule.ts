import type { Course, CourseSchedule, CourseStop } from "@/types";

export interface ActiveTrip {
  ddayLabel: string;
  courseLabel: string;
  /** 오늘이 여행 시작일 이후 ~ (시작일 + nights) 이내면 true — 다일 코스가 진행 중인 경우다. */
  ongoing: boolean;
  /** 코스에 담긴 모든 일차의 장소를 일차 구분 없이 중복 제거해 모은 목록 — 혼잡도 티커용. */
  stops: CourseStop[];
}

function daysUntil(dateIso: string, todayIso: string): number {
  const date = new Date(`${dateIso}T00:00:00`);
  const today = new Date(`${todayIso}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

function dedupeStops(days: CourseStop[][]): CourseStop[] {
  const seen = new Set<string>();
  const stops: CourseStop[] = [];
  for (const stop of days.flat()) {
    if (seen.has(stop.placeId)) continue;
    seen.add(stop.placeId);
    stops.push(stop);
  }
  return stops;
}

/**
 * 오늘 기준으로 "여행 중"이거나 withinDays일 이내에 시작하는 가장 가까운 일정을 홈 상태
 * 카드/혼잡도 티커용으로 찾는다. 여행 중인 일정이 있으면 그쪽을 우선한다.
 */
export function findActiveTrip(
  schedules: CourseSchedule[],
  courses: Course[],
  todayIso: string,
  withinDays = 7
): ActiveTrip | null {
  const candidates = schedules
    .map((schedule) => {
      const course = courses.find((c) => c.id === schedule.courseId);
      if (!course) return null;
      const dday = daysUntil(schedule.date, todayIso);
      const ongoing = dday <= 0 && dday >= -course.nights;
      return { schedule, course, dday, ongoing };
    })
    .filter(
      (c): c is NonNullable<typeof c> => c !== null && (c.ongoing || (c.dday >= 0 && c.dday <= withinDays))
    )
    .sort((a, b) => {
      if (a.ongoing !== b.ongoing) return a.ongoing ? -1 : 1;
      return a.dday - b.dday;
    });

  const nearest = candidates[0];
  if (!nearest) return null;

  return {
    ddayLabel: nearest.ongoing ? "여행 중" : nearest.dday === 0 ? "오늘 여행!" : `D-${nearest.dday}`,
    courseLabel: nearest.course.label,
    ongoing: nearest.ongoing,
    stops: dedupeStops(nearest.course.days),
  };
}
