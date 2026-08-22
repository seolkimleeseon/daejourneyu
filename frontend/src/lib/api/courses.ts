import type { Course } from "@/types";

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("코스 목록을 불러오지 못했어요");
  return res.json();
}

export async function createCourseApi(course: Omit<Course, "id">): Promise<Course> {
  const res = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(course),
  });
  if (!res.ok) throw new Error("코스 저장에 실패했어요");
  return res.json();
}

export type CourseUpdateInput = Partial<Pick<Course, "label" | "emoji" | "days">>;

export async function updateCourseApi(id: string, patch: CourseUpdateInput): Promise<Course> {
  const res = await fetch(`/api/courses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("코스 수정에 실패했어요");
  return res.json();
}

export async function deleteCourseApi(id: string): Promise<void> {
  const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("코스 삭제에 실패했어요");
}
