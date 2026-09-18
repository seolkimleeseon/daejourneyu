import { create } from "zustand";
import type { Course, CourseSchedule } from "@/types";
import { mockCourses } from "@/mocks";
import { createCourseApi, deleteCourseApi, updateCourseApi, type CourseUpdateInput } from "@/lib/api/courses";
import { createScheduleApi, deleteScheduleApi } from "@/lib/api/schedule";
import { useToastStore } from "@/stores/useToastStore";

/** addCourse가 서버 응답을 받기 전 임시로 붙이는 id 접두사.
 * ⚠ mockCourses의 id("course-1", "course-2")와 겹치면 안 된다 — 겹치면 임시 id로 오인해
 * 서버 응답이 와도 실제 id로 안 바뀌는 버그가 생긴다. */
const OPTIMISTIC_ID_PREFIX = "optimistic-";
let nextOptimisticId = 0;

interface CourseState {
  courses: Course[];
  /** 저장 중 사용한 임시 URL을 서버가 발급한 코스 ID로 연결한다. */
  courseIdAliases: Record<string, string>;
  /** addCourse로 막 만든 코스를 setCourses가 지우지 않게 보호하는 id 집합. 임시 id일 때만 지켜주면
   * 부족하다 — createCourseApi 응답이 빨리 와서 임시 id가 진짜 id로 바뀐 뒤에도, useCourses()의
   * staleTime(30초) 안에 있던 오래된 GET 응답이 뒤늦게 setCourses를 호출하면 그 진짜 id 코스가
   * 서버 목록(방금 저장을 반영 못한 스냅샷)에 없다는 이유로 통째로 사라진다 — "저장 직후 들어간
   * 상세 화면에서 코스를 못 찾는" 버그의 원인이었다. 임시 id와 그걸 대체한 진짜 id 둘 다 여기 넣어두고,
   * 서버 목록에 실제로 나타나면 그때 지운다. */
  pendingNewCourseIds: Set<string>;
  /** GET /api/courses 응답으로 최소 1번 교체됐는지. 로그인 사용자에게 courses의 초기값(mockCourses)을
   * 실제 데이터인 것처럼 잠깐 보여주지 않으려면, 화면에서 이 값이 true가 되기 전엔 로딩 상태를 보여줘야 한다. */
  hasSynced: boolean;
  /** 백엔드에서 불러온 목록으로 교체한다 — 서버가 정본이 된 뒤에는 이 값이 화면에 쓰인다. */
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Omit<Course, "id">) => Course;
  updateCourse: (id: string, patch: CourseUpdateInput) => Promise<void>;
  deleteCourse: (id: string) => void;

  /** 코스별 일정(CourseSchedule). 코스와 별개 개념이라 배열도 따로 둔다(루트 CLAUDE.md 도메인 용어). */
  schedules: CourseSchedule[];
  setSchedules: (schedules: CourseSchedule[]) => void;
  /** 코스에 날짜를 붙여 새 일정으로 등록한다(같은 코스도 여러 날짜에 등록 가능). */
  addSchedule: (courseId: string, date: string) => Promise<void>;
  /** 일정 하나를 취소한다(일정 id 기준). */
  removeSchedule: (scheduleId: string) => Promise<void>;
}

// 코스는 위저드에서 생성되는 사용자 데이터. 목데이터를 초기값 삼아 즉시 렌더링하고,
// SchedulePage 진입 시 GET /api/courses 결과로 setCourses해 서버 상태와 맞춘다.
export const useCourseStore = create<CourseState>((set, get) => ({
  courses: mockCourses,
  courseIdAliases: {},
  hasSynced: false,
  pendingNewCourseIds: new Set<string>(),
  // 서버 목록으로 완전히 덮어쓰되, 아직 createCourseApi 응답을 못 받아 실제 id로 바뀌지 않은
  // 낙관적 항목은 유지한다 — 안 그러면 "저장 직후 다른 화면으로 이동 → 그 화면이 GET /api/courses를
  // 다시 쏨" 타이밍에 막 저장한 코스가 잠깐 사라졌다가 다음 새로고침에야 나타나는 것처럼 보인다.
  setCourses: (courses) =>
    set((state) => {
      // 서버 목록에 실제로 반영된 걸 확인했으면 더 이상 보호할 필요 없다.
      const pendingNewCourseIds = new Set(state.pendingNewCourseIds);
      courses.forEach((c) => pendingNewCourseIds.delete(c.id));
      return {
        hasSynced: true,
        pendingNewCourseIds,
        courses: [
          ...courses,
          ...state.courses.filter(
            (c) =>
              (c.id.startsWith(OPTIMISTIC_ID_PREFIX) || pendingNewCourseIds.has(c.id)) &&
              !courses.some((serverCourse) => serverCourse.id === c.id)
          ),
        ],
      };
    }),
  addCourse: (course) => {
    const tempId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}-${++nextOptimisticId}`;
    const newCourse: Course = { ...course, id: tempId };
    set((state) => ({
      courses: [...state.courses, newCourse],
      pendingNewCourseIds: new Set(state.pendingNewCourseIds).add(tempId),
    }));
    // 화면은 낙관적으로 즉시 갱신하고, 백엔드 저장은 별도로 진행한다.
    // 응답이 오면 임시 id를 서버가 발급한 진짜 id로 교체한다 — 안 그러면 이 코스를 상세/일정
    // 등록 화면에서 서버 id로 다시 조회할 때 찾을 수 없다.
    createCourseApi(course)
      .then((serverCourse) => {
        set((state) => {
          const pendingNewCourseIds = new Set(state.pendingNewCourseIds);
          pendingNewCourseIds.delete(tempId);
          const alreadyListed = state.courses.some((item) => item.id === serverCourse.id);
          if (!alreadyListed) pendingNewCourseIds.add(serverCourse.id);
          return {
            pendingNewCourseIds,
            courseIdAliases: { ...state.courseIdAliases, [tempId]: serverCourse.id },
            courses: alreadyListed
              ? state.courses.filter((item) => item.id !== tempId)
              : state.courses.map((item) => (item.id === tempId ? serverCourse : item)),
          };
        });
      })
      .catch((error) => {
        console.error("코스를 백엔드에 저장하지 못했어요:", error);
        set((state) => {
          const pendingNewCourseIds = new Set(state.pendingNewCourseIds);
          pendingNewCourseIds.delete(tempId);
          return {
            pendingNewCourseIds,
            courses: state.courses.filter((item) => item.id !== tempId),
          };
        });
        useToastStore.getState().show("코스를 저장하지 못했어요. 다시 시도해주세요.");
      });
    return newCourse;
  },
  updateCourse: (id, patch) => {
    set({
      courses: get().courses.map((course) => (course.id === id ? { ...course, ...patch } : course)),
    });
    // 호출부가 완료를 기다렸다가 useCourses()의 react-query 캐시를 무효화할 수 있게 프라미스를
    // 그대로 돌려준다 — 안 그러면 이 수정 전에 캐시된 낡은 GET 응답이 다른 화면(보관함 등)의
    // useSyncCoursesFromApi를 통해 뒤늦게 setCourses를 부르며 방금 고친 내용을 되돌려버린다.
    return updateCourseApi(id, patch).then(
      () => undefined,
      (error) => {
        console.error("코스 수정을 백엔드에 반영하지 못했어요:", error);
        throw error;
      }
    );
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
  // setCourses와 같은 이유(위 주석 참고) — useSchedules()의 react-query 캐시(staleTime 30초)가
  // 저장 이전 스냅샷을 들고 있으면, 저장 직후 다른 화면으로 이동했을 때 이 stale 응답이 방금
  // addSchedule로 추가한 항목을 통째로 덮어써 지워버린다. 서버 목록에 없는 로컬 항목(막 추가되어
  // 아직 이 캐시엔 안 잡힌 것)은 지우지 않고 같이 들고 있는다.
  setSchedules: (schedules) =>
    set((state) => ({
      schedules: [
        ...schedules,
        ...state.schedules.filter((s) => !schedules.some((server) => server.id === s.id)),
      ],
    })),
  addSchedule: async (courseId, date) => {
    const schedule = await createScheduleApi(courseId, date);
    set({ schedules: [...get().schedules, schedule] });
  },
  removeSchedule: async (scheduleId) => {
    await deleteScheduleApi(scheduleId);
    set({ schedules: get().schedules.filter((s) => s.id !== scheduleId) });
  },
}));
