import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCourses } from "@/hooks/useCourses";
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

describe("useCourses", () => {
  it("로그인 상태면 코스를 불러온다", async () => {
    const { result } = renderWithClient(() => useCourses());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([course]);
  });

  it("비로그인이면 요청하지 않는다 — 어차피 401이다", () => {
    useAuthStore.setState({ isLoggedIn: false });

    const { result } = renderWithClient(() => useCourses());

    expect(fetchCourses).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("탭 안을 옮겨 다녀도 잠깐 사이에 다시 쏘지 않는다", async () => {
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);

    const first = renderHook(() => useCourses(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    renderHook(() => useCourses(), { wrapper });

    // staleTime 30초 — 저장 직후 다른 화면으로 옮길 때 stale 응답과 경합하는 걸 막는다.
    expect(fetchCourses).toHaveBeenCalledTimes(1);
  });
});
