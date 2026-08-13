import { create } from "zustand";
import type { Course } from "@/types";
import { mockCourses } from "@/mocks";

interface CourseState {
  courses: Course[];
  addCourse: (course: Omit<Course, "id">) => Course;
}

// TODO(api): 코스는 위저드에서 생성되는 사용자 데이터라 목데이터를 시드로 삼는 클라이언트 스토어로 관리한다.
export const useCourseStore = create<CourseState>((set, get) => ({
  courses: mockCourses,
  addCourse: (course) => {
    const newCourse: Course = { ...course, id: `course-${Date.now()}` };
    set({ courses: [...get().courses, newCourse] });
    return newCourse;
  },
}));
