import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScheduleApi, deleteScheduleApi, fetchSchedulesApi } from "@/lib/api/schedule";
import { makeSchedule } from "@/test/fixtures";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const schedule = makeSchedule({ id: "s1", courseId: "course-1", date: "2026-10-01" });

describe("fetchSchedulesApi", () => {
  it("내 코스들의 일정을 한 번에 가져온다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([schedule]));

    expect(await fetchSchedulesApi()).toEqual([schedule]);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses/schedules", { credentials: "include" });
  });

  it("실패를 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 401 }));

    await expect(fetchSchedulesApi()).rejects.toThrow("일정 목록을 불러오지 못했어요");
  });
});

describe("createScheduleApi", () => {
  it("코스에 날짜를 붙여 등록한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(schedule));

    expect(await createScheduleApi("course-1", "2026-10-01")).toEqual(schedule);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses/course-1/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: "2026-10-01" }),
      credentials: "include",
    });
  });

  it("등록 실패를 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 400 }));

    await expect(createScheduleApi("course-1", "2026-10-01")).rejects.toThrow(
      "일정 등록에 실패했어요"
    );
  });
});

describe("deleteScheduleApi", () => {
  it("코스가 아니라 일정 id로 취소한다 — 같은 코스가 여러 날짜에 등록될 수 있다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await deleteScheduleApi("s1");

    expect(fetchMock).toHaveBeenCalledWith("/api/courses/schedule/s1", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("취소 실패를 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(deleteScheduleApi("s1")).rejects.toThrow("일정 취소에 실패했어요");
  });
});
