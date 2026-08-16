import type { Course, CourseSchedule } from "@/types";

export interface UpcomingTrip {
  ddayLabel: string;
  courseLabel: string;
}

function daysUntil(dateIso: string, todayIso: string): number {
  const date = new Date(`${dateIso}T00:00:00`);
  const today = new Date(`${todayIso}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / 86_400_000);
}

/** 오늘부터 withinDays일 이내에 예정된 가장 가까운 일정을 홈 상태 카드용으로 반환한다. */
export function findUpcomingTrip(
  schedules: CourseSchedule[],
  courses: Course[],
  todayIso: string,
  withinDays = 7
): UpcomingTrip | null {
  const nearest = schedules
    .map((schedule) => ({ schedule, dday: daysUntil(schedule.date, todayIso) }))
    .filter(({ dday }) => dday >= 0 && dday <= withinDays)
    .sort((a, b) => a.dday - b.dday)[0];
  if (!nearest) return null;

  const course = courses.find((c) => c.id === nearest.schedule.courseId);
  if (!course) return null;

  return {
    ddayLabel: nearest.dday === 0 ? "오늘 여행!" : `D-${nearest.dday}`,
    courseLabel: course.label,
  };
}
