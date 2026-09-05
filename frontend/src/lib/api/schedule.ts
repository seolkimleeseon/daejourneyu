import { authFetch } from "./authFetch";
import type { CourseSchedule } from "@/types";

/** 내 코스들에 등록된 일정 전체. */
export async function fetchSchedulesApi(): Promise<CourseSchedule[]> {
  const res = await authFetch("/api/courses/schedules");
  if (!res.ok) throw new Error("일정 목록을 불러오지 못했어요");
  return res.json();
}

/** 코스에 날짜를 붙여 등록(이미 등록돼 있으면 날짜만 교체). */
export async function upsertScheduleApi(courseId: string, date: string): Promise<CourseSchedule> {
  const res = await authFetch(`/api/courses/${courseId}/schedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
  if (!res.ok) throw new Error("일정 등록에 실패했어요");
  return res.json();
}

/** 일정 취소. */
export async function deleteScheduleApi(courseId: string): Promise<void> {
  const res = await authFetch(`/api/courses/${courseId}/schedule`, { method: "DELETE" });
  if (!res.ok) throw new Error("일정 취소에 실패했어요");
}
