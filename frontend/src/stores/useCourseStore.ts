import { create } from "zustand";
import type { Course } from "@/types";
import { mockCourses } from "@/mocks";
import { createCourseApi, deleteCourseApi, updateCourseApi, type CourseUpdateInput } from "@/lib/api/courses";

interface CourseState {
  courses: Course[];
  /** 백엔드에서 불러온 목록으로 교체한다 — 서버가 정본이 된 뒤에는 이 값이 화면에 쓰인다. */
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, "id">) => Course;
  updateCourse: (id: string, patch: CourseUpdateInput) => void;
  deleteCourse: (id: string) => void;
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
    set({ courses: get().courses.filter((course) => course.id !== id) });
    deleteCourseApi(id).catch((error) => {
      console.error("코스 삭제를 백엔드에 반영하지 못했어요:", error);
    });
  },
}));
