import { create } from "zustand";
import type { Course, CourseSchedule } from "@/types";
import { mockCourses } from "@/mocks";
import { createCourseApi, deleteCourseApi, updateCourseApi, type CourseUpdateInput } from "@/lib/api/courses";
import { deleteScheduleApi, upsertScheduleApi } from "@/lib/api/schedule";

interface CourseState {
  courses: Course[];
  /** 백엔드에서 불러온 목록으로 교체한다 — 서버가 정본이 된 뒤에는 이 값이 화면에 쓰인다. */
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, "id">) => Course;
  updateCourse: (id: string, patch: CourseUpdateInput) => void;
  deleteCourse: (id: string) => void;

  /** 코스별 일정(CourseSchedule). 코스와 별개 개념이라 배열도 따로 둔다(루트 CLAUDE.md 도메인 용어). */
  schedules: CourseSchedule[];
  setSchedules: (schedules: CourseSchedule[]) => void;
  /** 코스에 날짜를 붙여 일정에 등록/수정한다. */
  setSchedule: (courseId: string, date: string) => Promise<void>;
  /** 일정 취소. */
  removeSchedule: (courseId: string) => Promise<void>;
}

// 코스는 위저드에서 생성되는 사용자 데이터. 목데이터를 초기값 삼아 즉시 렌더링하고,
// SchedulePage 진입 시 GET /api/courses 결과로 setCourses해 서버 상태와 맞춘다.
export const useCourseStore = create<CourseState>((set, get) => ({
  courses: mockCourses,
  setCourses: (courses) => set({ courses }),
  addCourse: (course) => {
    const newCourse: Course = { ...course, id: `course-${Date.now()}` };
    set({ courses: [...get().courses, newCourse] });
    // 화면은 낙관적으로 즉시 갱신하고, 백엔드 저장은 별도로 진행한다.
    // 실패해도 로컬 보관함에는 남아 있으니 조용히 로그만 남긴다.
    createCourseApi(course).catch((error) => {
      console.error("코스를 백엔드에 저장하지 못했어요:", error);
    });
    return newCourse;
  },
  updateCourse: (id, patch) => {
    set({
      courses: get().courses.map((course) => (course.id === id ? { ...course, ...patch } : course)),
    });
    updateCourseApi(id, patch).catch((error) => {
      console.error("코스 수정을 백엔드에 반영하지 못했어요:", error);
    });
  },
  deleteCourse: (id) => {
    set({
      courses: get().courses.filter((course) => course.id !== id),
      // 코스가 지워지면 백엔드에서도 CASCADE로 일정이 같이 지워진다 — 로컬 상태도 맞춘다.
      schedules: get().schedules.filter((schedule) => schedule.courseId !== id),
    });
    deleteCourseApi(id).catch((error) => {
      console.error("코스 삭제를 백엔드에 반영하지 못했어요:", error);
    });
  },

  schedules: [],
  setSchedules: (schedules) => set({ schedules }),
  setSchedule: async (courseId, date) => {
    const schedule = await upsertScheduleApi(courseId, date);
    set({
      schedules: [...get().schedules.filter((s) => s.courseId !== courseId), schedule],
    });
  },
  removeSchedule: async (courseId) => {
    await deleteScheduleApi(courseId);
    set({ schedules: get().schedules.filter((s) => s.courseId !== courseId) });
  },
}));
