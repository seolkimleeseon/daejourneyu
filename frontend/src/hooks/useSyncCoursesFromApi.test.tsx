import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { fetchCourses } from "@/lib/api/courses";
import { fetchSchedulesApi } from "@/lib/api/schedule";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { makeCourse, makeSchedule } from "@/test/fixtures";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

vi.mock("@/lib/api/courses", () => ({
  fetchCourses: vi.fn(),
  createCourseApi: vi.fn(),
  updateCourseApi: vi.fn(),
  deleteCourseApi: vi.fn(),
}));
vi.mock("@/lib/api/schedule", () => ({
  fetchSchedulesApi: vi.fn(),
  createScheduleApi: vi.fn(),
  deleteScheduleApi: vi.fn(),
}));

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

const course = makeCourse({ id: "server-1", label: "서버 코스" });
const schedule = makeSchedule({ id: "s1", courseId: "server-1" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchCourses).mockResolvedValue([course]);
  vi.mocked(fetchSchedulesApi).mockResolvedValue([schedule]);
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useCourseStore.setState({ courses: [], schedules: [], hasSynced: false });
});

describe("useSyncCoursesFromApi", () => {
  it("받아온 코스·일정을 스토어에 반영한다", async () => {
    renderWithClient(() => useSyncCoursesFromApi());

    await waitFor(() => {
      expect(useCourseStore.getState().courses).toEqual([course]);
      expect(useCourseStore.getState().schedules).toEqual([schedule]);
    });
  });

  it("동기화되면 hasSynced를 켠다 — 화면이 목데이터를 실데이터로 오인하지 않게", async () => {
    renderWithClient(() => useSyncCoursesFromApi());

    await waitFor(() => expect(useCourseStore.getState().hasSynced).toBe(true));
  });

  it("비로그인이면 스토어를 건드리지 않는다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    useCourseStore.setState({ courses: [makeCourse({ id: "local-1" })] });

    renderWithClient(() => useSyncCoursesFromApi());

    await waitFor(() => expect(fetchCourses).not.toHaveBeenCalled());
    expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["local-1"]);
    expect(useCourseStore.getState().hasSynced).toBe(false);
  });

  it("코스 조회가 실패해도 터지지 않는다", async () => {
    vi.mocked(fetchCourses).mockRejectedValue(new Error("서버 오류"));

    renderWithClient(() => useSyncCoursesFromApi());

    // 일정 쪽은 정상이라 그대로 반영돼야 한다.
    await waitFor(() => expect(useCourseStore.getState().schedules).toEqual([schedule]));
    expect(useCourseStore.getState().hasSynced).toBe(false);
  });

  it("딥링크로 코스 상세에 바로 들어와도 스토어가 채워진다", async () => {
    // '/schedule'을 거치지 않아 스토어가 비어 있는 상태에서 상세가 이 훅만 부르는 경우.
    useCourseStore.setState({ courses: [], hasSynced: false });

    renderWithClient(() => useSyncCoursesFromApi());

    await waitFor(() => expect(useCourseStore.getState().courses).toHaveLength(1));
  });
});
