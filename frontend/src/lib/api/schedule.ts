import { authFetch } from "./authFetch";
import type { CourseSchedule } from "@/types";

/** 내 코스들에 등록된 일정 전체. */
export async function fetchSchedulesApi(): Promise<CourseSchedule[]> {
  const res = await authFetch("/api/courses/schedules");
  if (!res.ok) throw new Error("일정 목록을 불러오지 못했어요");
  return res.json();
}

/** 코스에 날짜를 붙여 새 일정으로 등록한다. 코스 1개가 여러 날짜에 등록될 수 있다. */
export async function createScheduleApi(courseId: string, date: string): Promise<CourseSchedule> {
  const res = await authFetch(`/api/courses/${courseId}/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error("일정 등록에 실패했어요");
  return res.json();
}

/** 등록된 일정 하나를 취소한다(일정 id 기준). */
export async function deleteScheduleApi(scheduleId: string): Promise<void> {
  const res = await authFetch(`/api/courses/schedule/${scheduleId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("일정 취소에 실패했어요");
}
