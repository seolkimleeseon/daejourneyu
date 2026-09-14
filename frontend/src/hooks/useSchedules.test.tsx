import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSchedules } from "@/hooks/useSchedules";
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

describe("useSchedules", () => {
  it("로그인 상태면 일정을 불러온다", async () => {
    const { result } = renderWithClient(() => useSchedules());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([schedule]);
  });

  it("비로그인이면 요청하지 않는다", () => {
    useAuthStore.setState({ isLoggedIn: false });

    renderWithClient(() => useSchedules());

    expect(fetchSchedulesApi).not.toHaveBeenCalled();
  });
});
