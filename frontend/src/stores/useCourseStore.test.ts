import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCourseStore } from "@/stores/useCourseStore";
import { makeCourse, makeSchedule } from "@/test/fixtures";

const api = vi.hoisted(() => ({
  createCourseApi: vi.fn(),
  updateCourseApi: vi.fn(),
  deleteCourseApi: vi.fn(),
  createScheduleApi: vi.fn(),
  deleteScheduleApi: vi.fn(),
}));
vi.mock("@/lib/api/courses", () => ({
  createCourseApi: api.createCourseApi,
  updateCourseApi: api.updateCourseApi,
  deleteCourseApi: api.deleteCourseApi,
}));
vi.mock("@/lib/api/schedule", () => ({
  createScheduleApi: api.createScheduleApi,
  deleteScheduleApi: api.deleteScheduleApi,
}));

const serverCourse = makeCourse({ id: "server-1", label: "서버 코스" });

/** addCourse가 만드는 미확정 항목 — id만 알면 되므로 반환값에서 꺼내 쓴다. */
function newCourseInput() {
  const { id: _id, ...rest } = makeCourse({ label: "새 코스" });
  return rest;
}

beforeEach(() => {
  vi.clearAllMocks();
  api.createCourseApi.mockResolvedValue(serverCourse);
  api.updateCourseApi.mockResolvedValue(undefined);
  api.deleteCourseApi.mockResolvedValue(undefined);
  useCourseStore.setState({ courses: [], schedules: [], hasSynced: false });
});

describe("setCourses", () => {
  it("서버 목록으로 갈아끼우고 동기화됐음을 표시한다", () => {
    useCourseStore.setState({ courses: [makeCourse({ id: "course-1" })] });

    useCourseStore.getState().setCourses([serverCourse]);

    expect(useCourseStore.getState().courses).toEqual([serverCourse]);
    expect(useCourseStore.getState().hasSynced).toBe(true);
  });

  it("목데이터 초기값은 서버 목록이 오면 사라진다", () => {
    // hasSynced 이전의 courses는 mockCourses라 로그인 사용자에게 남으면 안 된다.
    useCourseStore.setState({ courses: [makeCourse({ id: "course-1" }), makeCourse({ id: "course-2" })] });

    useCourseStore.getState().setCourses([]);

    expect(useCourseStore.getState().courses).toEqual([]);
  });

  it("아직 서버 응답을 못 받은 낙관적 항목은 살려둔다", () => {
    // 저장 직후 다른 화면으로 넘어가 GET이 다시 돌면 막 만든 코스가 잠깐 사라져 보인다.
    const optimistic = makeCourse({ id: "optimistic-1757800000000", label: "방금 만든 코스" });
    useCourseStore.setState({ courses: [optimistic] });

    useCourseStore.getState().setCourses([serverCourse]);

    expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual([
      "server-1",
      "optimistic-1757800000000",
    ]);
  });

  it("서버 목록에 이미 들어온 낙관적 항목은 중복으로 두지 않는다", () => {
    const optimistic = makeCourse({ id: "optimistic-1757800000000" });
    useCourseStore.setState({ courses: [optimistic] });

    useCourseStore.getState().setCourses([optimistic]);

    expect(useCourseStore.getState().courses).toHaveLength(1);
  });
});

describe("addCourse", () => {
  it("화면에 먼저 붙이고 임시 id를 돌려준다", () => {
    const created = useCourseStore.getState().addCourse(newCourseInput());

    expect(created.id).toMatch(/^optimistic-/);
    expect(useCourseStore.getState().courses).toHaveLength(1);
  });

  it("임시 id는 목데이터 id와 겹치지 않는다 — 겹치면 목데이터가 영영 안 지워진다", () => {
    const created = useCourseStore.getState().addCourse(newCourseInput());

    expect(created.id).not.toMatch(/^course-\d+$/);
  });

  it("서버 응답이 오면 진짜 id로 바꿔 끼운다", async () => {
    useCourseStore.getState().addCourse(newCourseInput());

    await vi.waitFor(() => {
      expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["server-1"]);
    });
  });

  it("저장에 실패해도 화면의 코스를 지우지 않는다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    api.createCourseApi.mockRejectedValue(new Error("네트워크 오류"));

    const created = useCourseStore.getState().addCourse(newCourseInput());

    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual([created.id]);
  });
});

describe("updateCourse", () => {
  it("로컬을 먼저 고치고 서버에도 보낸다", () => {
    useCourseStore.setState({ courses: [serverCourse] });

    useCourseStore.getState().updateCourse("server-1", { label: "이름 바꿈" });

    expect(useCourseStore.getState().courses[0].label).toBe("이름 바꿈");
    expect(api.updateCourseApi).toHaveBeenCalledWith("server-1", { label: "이름 바꿈" });
  });

  it("없는 id면 아무것도 바꾸지 않는다", () => {
    useCourseStore.setState({ courses: [serverCourse] });

    useCourseStore.getState().updateCourse("없는-id", { label: "무시" });

    expect(useCourseStore.getState().courses[0].label).toBe("서버 코스");
  });
});

describe("deleteCourse", () => {
  it("코스를 지우면 그 코스의 일정도 같이 지운다 — 서버도 CASCADE로 지운다", () => {
    useCourseStore.setState({
      courses: [serverCourse, makeCourse({ id: "server-2" })],
      schedules: [
        makeSchedule({ id: "s1", courseId: "server-1" }),
        makeSchedule({ id: "s2", courseId: "server-2" }),
      ],
    });

    useCourseStore.getState().deleteCourse("server-1");

    expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["server-2"]);
    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s2"]);
    expect(api.deleteCourseApi).toHaveBeenCalledWith("server-1");
  });
});

describe("setSchedules", () => {
  it("서버 목록으로 맞춘다", () => {
    const schedule = makeSchedule({ id: "s1" });

    useCourseStore.getState().setSchedules([schedule]);

    expect(useCourseStore.getState().schedules).toEqual([schedule]);
  });

  it("서버에 아직 안 잡힌 로컬 일정은 지우지 않는다 — stale 캐시가 방금 등록한 걸 덮는다", () => {
    const justAdded = makeSchedule({ id: "s-new" });
    useCourseStore.setState({ schedules: [justAdded] });

    useCourseStore.getState().setSchedules([makeSchedule({ id: "s-old" })]);

    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s-old", "s-new"]);
  });

  it("서버 목록에 있는 항목은 중복으로 두지 않는다", () => {
    const schedule = makeSchedule({ id: "s1" });
    useCourseStore.setState({ schedules: [schedule] });

    useCourseStore.getState().setSchedules([schedule]);

    expect(useCourseStore.getState().schedules).toHaveLength(1);
  });
});

describe("addSchedule / removeSchedule", () => {
  it("서버가 만든 일정을 받아 목록에 넣는다", async () => {
    const created = makeSchedule({ id: "s1", courseId: "server-1", date: "2026-10-01" });
    api.createScheduleApi.mockResolvedValue(created);

    await useCourseStore.getState().addSchedule("server-1", "2026-10-01");

    expect(api.createScheduleApi).toHaveBeenCalledWith("server-1", "2026-10-01");
    expect(useCourseStore.getState().schedules).toEqual([created]);
  });

  it("같은 코스를 여러 날짜에 등록할 수 있다", async () => {
    api.createScheduleApi
      .mockResolvedValueOnce(makeSchedule({ id: "s1", courseId: "c1", date: "2026-10-01" }))
      .mockResolvedValueOnce(makeSchedule({ id: "s2", courseId: "c1", date: "2026-10-08" }));

    await useCourseStore.getState().addSchedule("c1", "2026-10-01");
    await useCourseStore.getState().addSchedule("c1", "2026-10-08");

    expect(useCourseStore.getState().schedules).toHaveLength(2);
  });

  it("서버 저장이 실패하면 목록에 넣지 않는다", async () => {
    api.createScheduleApi.mockRejectedValue(new Error("실패"));

    await expect(useCourseStore.getState().addSchedule("c1", "2026-10-01")).rejects.toThrow();
    expect(useCourseStore.getState().schedules).toEqual([]);
  });

  it("취소하면 서버에서 지운 뒤 목록에서도 뺀다", async () => {
    api.deleteScheduleApi.mockResolvedValue(undefined);
    useCourseStore.setState({
      schedules: [makeSchedule({ id: "s1" }), makeSchedule({ id: "s2" })],
    });

    await useCourseStore.getState().removeSchedule("s1");

    expect(api.deleteScheduleApi).toHaveBeenCalledWith("s1");
    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s2"]);
  });

  it("서버 삭제가 실패하면 목록에서도 빼지 않는다", async () => {
    api.deleteScheduleApi.mockRejectedValue(new Error("실패"));
    useCourseStore.setState({ schedules: [makeSchedule({ id: "s1" })] });

    await expect(useCourseStore.getState().removeSchedule("s1")).rejects.toThrow();
    expect(useCourseStore.getState().schedules).toHaveLength(1);
  });
});
