import { create } from "zustand";
import type { Course, CourseSchedule } from "@/types";
import { mockCourses } from "@/mocks";
import { createCourseApi, deleteCourseApi, updateCourseApi, type CourseUpdateInput } from "@/lib/api/courses";
import { deleteScheduleApi, upsertScheduleApi } from "@/lib/api/schedule";

/** addCourse가 서버 응답을 받기 전 임시로 붙이는 id 접두사. setCourses가 이 접두사의 미확정
 * 항목을 서버 목록으로 덮어쓰지 않도록 구분하는 데 쓰인다.
 * ⚠ mockCourses의 id("course-1", "course-2")와 겹치면 안 된다 — 겹치면 서버 동기화 후에도
 * "아직 응답 안 온 낙관적 항목"으로 오인해 목데이터가 영원히 안 지워지는 버그가 생긴다. */
const OPTIMISTIC_ID_PREFIX = "optimistic-";

interface CourseState {
  courses: Course[];
  /** GET /api/courses 응답으로 최소 1번 교체됐는지. 로그인 사용자에게 courses의 초기값(mockCourses)을
   * 실제 데이터인 것처럼 잠깐 보여주지 않으려면, 화면에서 이 값이 true가 되기 전엔 로딩 상태를 보여줘야 한다. */
  hasSynced: boolean;
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
  hasSynced: false,
  // 서버 목록으로 완전히 덮어쓰되, 아직 createCourseApi 응답을 못 받아 실제 id로 바뀌지 않은
  // 낙관적 항목은 유지한다 — 안 그러면 "저장 직후 다른 화면으로 이동 → 그 화면이 GET /api/courses를
  // 다시 쏨" 타이밍에 막 저장한 코스가 잠깐 사라졌다가 다음 새로고침에야 나타나는 것처럼 보인다.
  setCourses: (courses) =>
    set((state) => ({
      hasSynced: true,
      courses: [
        ...courses,
        ...state.courses.filter(
          (c) => c.id.startsWith(OPTIMISTIC_ID_PREFIX) && !courses.some((serverCourse) => serverCourse.id === c.id)
        ),
      ],
    })),
  addCourse: (course) => {
    const tempId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}`;
    const newCourse: Course = { ...course, id: tempId };
    set({ courses: [...get().courses, newCourse] });
    // 화면은 낙관적으로 즉시 갱신하고, 백엔드 저장은 별도로 진행한다.
    // 응답이 오면 임시 id를 서버가 발급한 진짜 id로 교체한다 — 안 그러면 이 코스를 상세/일정
    // 등록 화면에서 서버 id로 다시 조회할 때 찾을 수 없다.
    createCourseApi(course)
      .then((serverCourse) => {
        set({
          courses: get().courses.map((c) => (c.id === tempId ? serverCourse : c)),
        });
      })
      .catch((error) => {
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
