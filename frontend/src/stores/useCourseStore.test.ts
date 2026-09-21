import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makeCourse, makePet, makeSchedule } from "@/test/fixtures";

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
  useCourseStore.setState({ courses: [], schedules: [], hasSynced: false, pendingNewCourseIds: new Set(), pendingNewScheduleIds: new Set(), removedScheduleIds: new Set(), courseIdAliases: {} });
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

  it("임시 id가 진짜 id로 바뀐 뒤에도, 그걸 반영 못한 낡은 서버 응답이 지우지 않는다", async () => {
    // 저장 직후 코스 상세로 바로 들어가면: addCourse의 응답이 이미 와서 임시 id는 진짜 id로
    // 바뀌었는데, useCourses()의 staleTime(30초) 동안 캐시된 낡은 GET 응답이 그 상세 화면에서
    // 뒤늦게 setCourses를 부르는 경우가 있다 — 그 응답엔 방금 만든 코스가 아직 없다.
    const created = useCourseStore.getState().addCourse(newCourseInput());
    await vi.waitFor(() => {
      expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["server-1"]);
    });
    void created;

    // 새 코스가 생기기 전에 캐시된, 그 코스가 없는 낡은 서버 목록.
    useCourseStore.getState().setCourses([]);

    expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["server-1"]);
  });
});

describe("addCourse — 반려동물 연결", () => {
  beforeEach(() => {
    usePetStore.setState({ pets: [makePet({ id: "pet-1" }), makePet({ id: "pet-2" })], activePetIndex: 1 });
  });

  it("지금 활성인 반려동물을 코스에 붙여 서버에도 보낸다", () => {
    const created = useCourseStore.getState().addCourse(newCourseInput());

    expect(created.petId).toBe("pet-2");
    expect(api.createCourseApi).toHaveBeenCalledWith(expect.objectContaining({ petId: "pet-2" }));
  });

  it("호출부가 반려동물을 정해 보냈으면 그대로 둔다", () => {
    const created = useCourseStore.getState().addCourse({ ...newCourseInput(), petId: "pet-1" });

    expect(created.petId).toBe("pet-1");
  });

  it("반려동물이 없으면(비로그인 직후 등) 비워 둔다", () => {
    usePetStore.setState({ pets: [], activePetIndex: 0 });

    const created = useCourseStore.getState().addCourse(newCourseInput());

    expect(created.petId).toBeNull();
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
    const created = useCourseStore.getState().addCourse(newCourseInput());

    await vi.waitFor(() => {
      expect(useCourseStore.getState().courses.map((c) => c.id)).toEqual(["server-1"]);
      expect(useCourseStore.getState().courseIdAliases[created.id]).toBe("server-1");
    });
  });

  it("저장에 실패하면 임시 코스를 제거하고 실패를 알린다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    api.createCourseApi.mockRejectedValue(new Error("네트워크 오류"));

    const created = useCourseStore.getState().addCourse(newCourseInput());

    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(useCourseStore.getState().courses).toEqual([]);
    expect(useCourseStore.getState().pendingNewCourseIds.has(created.id)).toBe(false);
    expect(useToastStore.getState().message).toContain("저장하지 못했어요");
  });

  it("목록 조회가 저장 응답보다 먼저 오더라도 같은 코스를 중복 표시하지 않는다", async () => {
    let finish!: (course: typeof serverCourse) => void;
    api.createCourseApi.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const created = useCourseStore.getState().addCourse(newCourseInput());

    useCourseStore.getState().setCourses([serverCourse]);
    finish(serverCourse);

    await vi.waitFor(() => {
      expect(useCourseStore.getState().courses.map((item) => item.id)).toEqual(["server-1"]);
      expect(useCourseStore.getState().courseIdAliases[created.id]).toBe("server-1");
    });
  });

  it("같은 시각에 코스를 두 번 저장해도 임시 ID가 겹치지 않는다", () => {
    const first = useCourseStore.getState().addCourse(newCourseInput());
    const second = useCourseStore.getState().addCourse(newCourseInput());
    expect(first.id).not.toBe(second.id);
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

  it("방금 등록했는데 서버 목록엔 아직 안 잡힌 일정은 지우지 않는다 — stale 캐시가 방금 등록한 걸 덮는다", () => {
    const justAdded = makeSchedule({ id: "s-new" });
    useCourseStore.setState({ schedules: [justAdded], pendingNewScheduleIds: new Set(["s-new"]) });

    useCourseStore.getState().setSchedules([makeSchedule({ id: "s-old" })]);

    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s-old", "s-new"]);
  });

  it("서버 목록에 없고 방금 등록한 것도 아닌 로컬 일정은 버린다 — 다른 기기에서 지운 일정이 남지 않게", () => {
    useCourseStore.setState({ schedules: [makeSchedule({ id: "s-gone" })] });

    useCourseStore.getState().setSchedules([makeSchedule({ id: "s-old" })]);

    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s-old"]);
  });

  it("서버 목록에 나타나면 보호를 푼다 — 그 뒤 서버에서 사라지면 같이 사라진다", () => {
    const schedule = makeSchedule({ id: "s-new" });
    useCourseStore.setState({ schedules: [schedule], pendingNewScheduleIds: new Set(["s-new"]) });

    useCourseStore.getState().setSchedules([schedule]);
    useCourseStore.getState().setSchedules([]);

    expect(useCourseStore.getState().schedules).toEqual([]);
  });

  it("취소한 일정은 취소 전 스냅샷을 든 낡은 서버 목록이 와도 되살아나지 않는다", () => {
    const cancelled = makeSchedule({ id: "s-cancelled" });
    useCourseStore.setState({ schedules: [], removedScheduleIds: new Set(["s-cancelled"]) });

    useCourseStore.getState().setSchedules([cancelled]);

    expect(useCourseStore.getState().schedules).toEqual([]);
  });

  it("서버 목록에서 실제로 사라진 게 확인되면 취소 기록을 푼다", () => {
    const cancelled = makeSchedule({ id: "s-cancelled" });
    useCourseStore.setState({ removedScheduleIds: new Set(["s-cancelled"]) });

    useCourseStore.getState().setSchedules([]);
    useCourseStore.getState().setSchedules([cancelled]);

    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s-cancelled"]);
  });

  it("서버 목록에 있는 항목은 중복으로 두지 않는다", () => {
    const schedule = makeSchedule({ id: "s1" });
    useCourseStore.setState({ schedules: [schedule], pendingNewScheduleIds: new Set(["s1"]) });

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

  it("등록 직후 도착한 낡은 서버 목록이 방금 등록한 일정을 지우지 않는다", async () => {
    const created = makeSchedule({ id: "s-created", courseId: "server-1", date: "2026-10-01" });
    api.createScheduleApi.mockResolvedValue(created);

    await useCourseStore.getState().addSchedule("server-1", "2026-10-01");
    useCourseStore.getState().setSchedules([]);

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

  it("취소한 직후 도착한 낡은 서버 목록이 취소한 일정을 되살리지 않는다", async () => {
    api.deleteScheduleApi.mockResolvedValue(undefined);
    const s1 = makeSchedule({ id: "s1" });
    const s2 = makeSchedule({ id: "s2" });
    useCourseStore.setState({ schedules: [s1, s2] });

    await useCourseStore.getState().removeSchedule("s1");
    useCourseStore.getState().setSchedules([s1, s2]);

    expect(useCourseStore.getState().schedules.map((s) => s.id)).toEqual(["s2"]);
  });

  it("서버 삭제가 실패하면 목록에서도 빼지 않는다", async () => {
    api.deleteScheduleApi.mockRejectedValue(new Error("실패"));
    useCourseStore.setState({ schedules: [makeSchedule({ id: "s1" })] });

    await expect(useCourseStore.getState().removeSchedule("s1")).rejects.toThrow();
    expect(useCourseStore.getState().schedules).toHaveLength(1);
  });
});
