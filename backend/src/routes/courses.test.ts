import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    course: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    courseSchedule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    courseDay: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("../lib/prisma", () => ({ prisma }));
vi.mock("../lib/auth", async () => {
  const { fakeAuthModule } = await import("../test/testApp");
  return fakeAuthModule();
});

import coursesRouter from "./courses";
import { asUser, createTestApp } from "../test/testApp";

const app = createTestApp("/api/courses", coursesRouter);
const AS_USER_1 = asUser("user-1");

const STOP = {
  placeId: "p1",
  name: "한밭수목원",
  category: "산책",
  district: "서구",
  condition: "전 견종",
  petFriendly: true,
};

const VALID_INPUT = {
  label: "유성 산책 코스",
  emoji: null,
  nights: 0,
  transport: "자차",
  source: "manual",
  shared: false,
  days: [[STOP, { ...STOP, placeId: "p2", name: "댕댕카페" }]],
};

/** 저장된 코스 한 줄 — 일차·정차지까지 붙어 온 모양. */
function courseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "course-1",
    userId: "user-1",
    label: "유성 산책 코스",
    emoji: null,
    nights: 0,
    transport: "자차",
    source: "manual",
    shared: false,
    days: [{ dayIndex: 0, stops: [{ ...STOP, order: 0, imageUrl: null }] }],
    ...overrides,
  };
}

function scheduleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "schedule-1",
    courseId: "course-1",
    date: "2026-09-20",
    festivalTitles: [{ title: "대전 0시 축제" }],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // $transaction은 콜백에 트랜잭션 클라이언트를 넘긴다 — 테스트에선 같은 prisma 목을 그대로 준다.
  prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) => fn(prisma));
});

describe("로그인", () => {
  it("모든 엔드포인트가 로그인을 요구한다 — 코스는 회원 전용 데이터다", async () => {
    const requests = [
      request(app).get("/api/courses"),
      request(app).get("/api/courses/schedules"),
      request(app).get("/api/courses/course-1"),
      request(app).post("/api/courses").send(VALID_INPUT),
      request(app).patch("/api/courses/course-1").send({ label: "새 이름" }),
      request(app).delete("/api/courses/course-1"),
      request(app).post("/api/courses/course-1/schedule").send({ date: "2026-09-20" }),
      request(app).delete("/api/courses/schedule/schedule-1"),
    ];

    for (const pending of requests) {
      const response = await pending;
      expect(response.status).toBe(401);
    }
  });
});

describe("GET /api/courses", () => {
  it("내 코스만 만든 순서대로 돌려준다", async () => {
    prisma.course.findMany.mockResolvedValue([courseRow()]);

    const response = await request(app).get("/api/courses").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" }, orderBy: { createdAt: "asc" } })
    );
    expect(response.body[0]).toMatchObject({ id: "course-1", label: "유성 산책 코스" });
  });

  it("일차별 동선을 이중 배열로 펴서 돌려준다 — 프론트가 days[일차][순번]으로 읽는다", async () => {
    prisma.course.findMany.mockResolvedValue([
      courseRow({
        days: [
          { dayIndex: 0, stops: [{ ...STOP, order: 0, imageUrl: null }] },
          { dayIndex: 1, stops: [{ ...STOP, placeId: "p2", name: "댕댕카페", order: 0, imageUrl: null }] },
        ],
      }),
    ]);

    const response = await request(app).get("/api/courses").set("Cookie", AS_USER_1);

    expect(response.body[0].days).toEqual([
      [expect.objectContaining({ placeId: "p1" })],
      [expect.objectContaining({ placeId: "p2" })],
    ]);
  });

  it("코스가 없으면 빈 배열이다", async () => {
    prisma.course.findMany.mockResolvedValue([]);

    const response = await request(app).get("/api/courses").set("Cookie", AS_USER_1);

    expect(response.body).toEqual([]);
  });
});

describe("GET /api/courses/schedules", () => {
  it("내 코스에 붙은 일정만 모아 돌려준다", async () => {
    prisma.courseSchedule.findMany.mockResolvedValue([scheduleRow()]);

    const response = await request(app).get("/api/courses/schedules").set("Cookie", AS_USER_1);

    expect(prisma.courseSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { course: { userId: "user-1" } } })
    );
    expect(response.body[0]).toEqual({
      id: "schedule-1",
      courseId: "course-1",
      date: "2026-09-20",
      festivalTitles: ["대전 0시 축제"],
    });
  });

  it("'schedules'가 코스 id로 잡아먹히지 않는다 — 라우트 등록 순서에 기대는 부분이다", async () => {
    prisma.courseSchedule.findMany.mockResolvedValue([]);

    await request(app).get("/api/courses/schedules").set("Cookie", AS_USER_1);

    expect(prisma.course.findUnique).not.toHaveBeenCalled();
  });
});

describe("GET /api/courses/:id", () => {
  it("내 코스면 상세를 돌려준다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow());

    const response = await request(app).get("/api/courses/course-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: "course-1" });
  });

  it("남의 코스는 있는지 없는지도 알려주지 않고 404로 통일한다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow({ userId: "user-2" }));

    const response = await request(app).get("/api/courses/course-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "코스를 찾을 수 없어요" });
  });

  it("없는 코스도 같은 404다", async () => {
    prisma.course.findUnique.mockResolvedValue(null);

    const response = await request(app).get("/api/courses/없는코스").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "코스를 찾을 수 없어요" });
  });
});

describe("POST /api/courses", () => {
  it("저장하고 201로 만들어진 코스를 돌려준다", async () => {
    prisma.course.create.mockResolvedValue(courseRow());

    const response = await request(app).post("/api/courses").set("Cookie", AS_USER_1).send(VALID_INPUT);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: "course-1" });
  });

  it("로그인한 사람 소유로 저장한다 — 요청 본문의 주인을 믿지 않는다", async () => {
    prisma.course.create.mockResolvedValue(courseRow());

    await request(app)
      .post("/api/courses")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, userId: "user-2" });

    expect(prisma.course.create.mock.lastCall?.[0].data.userId).toBe("user-1");
  });

  it("일차와 순번을 자리 순서대로 매겨 저장한다 — 클라이언트가 보낸 번호를 쓰지 않는다", async () => {
    prisma.course.create.mockResolvedValue(courseRow());

    await request(app)
      .post("/api/courses")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, nights: 1, days: [[STOP], [STOP, STOP]] });

    const days = prisma.course.create.mock.lastCall?.[0].data.days.create;
    expect(days.map((day: { dayIndex: number }) => day.dayIndex)).toEqual([0, 1]);
    expect(days[1].stops.create.map((stop: { order: number }) => stop.order)).toEqual([0, 1]);
  });

  it("형식이 틀리면 400으로 막고 저장하지 않는다", async () => {
    const badBodies = [
      { ...VALID_INPUT, label: "" },
      { ...VALID_INPUT, label: "   " },
      { ...VALID_INPUT, nights: -1 },
      { ...VALID_INPUT, transport: "비행기" },
      { ...VALID_INPUT, source: "훔쳐온것" },
      { ...VALID_INPUT, shared: "아니오" },
      { ...VALID_INPUT, days: [] },
      { ...VALID_INPUT, days: [[{ placeId: "p1" }]] },
      { ...VALID_INPUT, emoji: 42 },
    ];

    for (const body of badBodies) {
      const response = await request(app).post("/api/courses").set("Cookie", AS_USER_1).send(body);
      expect(response.status, JSON.stringify(body).slice(0, 50)).toBe(400);
    }
    expect(prisma.course.create).not.toHaveBeenCalled();
  });

  it("사진 주소는 없어도 되고 null이어도 된다 — 소스마다 있고 없고가 갈린다", async () => {
    prisma.course.create.mockResolvedValue(courseRow());

    const response = await request(app)
      .post("/api/courses")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, days: [[{ ...STOP, imageUrl: null }, { ...STOP, imageUrl: "https://img/a.jpg" }]] });

    expect(response.status).toBe(201);
  });
});

describe("PATCH /api/courses/:id", () => {
  beforeEach(() => {
    prisma.course.findUnique.mockResolvedValue(courseRow());
    prisma.course.update.mockResolvedValue(courseRow({ label: "새 이름" }));
  });

  it("보낸 필드만 고친다 — 이름만 보내면 이모지·동선은 건드리지 않는다", async () => {
    await request(app).patch("/api/courses/course-1").set("Cookie", AS_USER_1).send({ label: "새 이름" });

    const data = prisma.course.update.mock.lastCall?.[0].data;
    expect(data).toEqual({ label: "새 이름" });
    expect(prisma.courseDay.deleteMany).not.toHaveBeenCalled();
  });

  it("동선을 보내면 일차를 통째로 지우고 다시 만든다 — 순서·삭제를 한 번에 반영한다", async () => {
    await request(app)
      .patch("/api/courses/course-1")
      .set("Cookie", AS_USER_1)
      .send({ days: [[STOP]] });

    expect(prisma.courseDay.deleteMany).toHaveBeenCalledWith({ where: { courseId: "course-1" } });
    expect(prisma.course.update.mock.lastCall?.[0].data.days).toBeDefined();
  });

  it("지우기와 다시 만들기를 한 트랜잭션으로 묶는다 — 중간에 끊기면 동선이 사라진다", async () => {
    await request(app).patch("/api/courses/course-1").set("Cookie", AS_USER_1).send({ days: [[STOP]] });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("이모지를 null로 보내면 지운 것으로 다룬다 — 안 보낸 것과 구분한다", async () => {
    await request(app).patch("/api/courses/course-1").set("Cookie", AS_USER_1).send({ emoji: null });

    expect(prisma.course.update.mock.lastCall?.[0].data).toEqual({ emoji: null });
  });

  it("남의 코스는 고칠 수 없고 404다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow({ userId: "user-2" }));

    const response = await request(app).patch("/api/courses/course-1").set("Cookie", AS_USER_1).send({ label: "새 이름" });

    expect(response.status).toBe(404);
    expect(prisma.course.update).not.toHaveBeenCalled();
  });

  it("형식이 틀리면 400으로 막는다", async () => {
    for (const body of [{ label: "" }, { days: [] }, { days: [[{ placeId: 1 }]] }, { emoji: 42 }]) {
      const response = await request(app).patch("/api/courses/course-1").set("Cookie", AS_USER_1).send(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
    }
    expect(prisma.course.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/courses/:id", () => {
  it("내 코스면 지우고 본문 없이 204로 답한다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow());

    const response = await request(app).delete("/api/courses/course-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(204);
    expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: "course-1" } });
  });

  it("남의 코스는 지우지 않고 404다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow({ userId: "user-2" }));

    const response = await request(app).delete("/api/courses/course-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
    expect(prisma.course.delete).not.toHaveBeenCalled();
  });
});

describe("POST /api/courses/:id/schedule", () => {
  beforeEach(() => {
    prisma.course.findUnique.mockResolvedValue(courseRow());
    prisma.courseSchedule.create.mockResolvedValue(scheduleRow({ festivalTitles: [] }));
  });

  it("코스에 날짜를 붙여 새 일정으로 만든다", async () => {
    const response = await request(app)
      .post("/api/courses/course-1/schedule")
      .set("Cookie", AS_USER_1)
      .send({ date: "2026-09-20" });

    expect(response.status).toBe(200);
    expect(prisma.courseSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { courseId: "course-1", date: "2026-09-20" } })
    );
  });

  it("같은 코스를 여러 날짜에 등록할 수 있다 — 매번 새로 만든다", async () => {
    await request(app).post("/api/courses/course-1/schedule").set("Cookie", AS_USER_1).send({ date: "2026-09-20" });
    await request(app).post("/api/courses/course-1/schedule").set("Cookie", AS_USER_1).send({ date: "2026-09-21" });

    expect(prisma.courseSchedule.create).toHaveBeenCalledTimes(2);
  });

  it("YYYY-MM-DD가 아니면 400으로 막는다 — Date 파싱에 기대면 '2026-2-3'도 통과한다", async () => {
    for (const date of ["2026-2-3", "20260920", "2026/09/20", "내일", "", 20260920, null]) {
      const response = await request(app)
        .post("/api/courses/course-1/schedule")
        .set("Cookie", AS_USER_1)
        .send({ date });
      expect(response.status, String(date)).toBe(400);
    }
    expect(prisma.courseSchedule.create).not.toHaveBeenCalled();
  });

  it("남의 코스엔 일정을 붙일 수 없고 404다", async () => {
    prisma.course.findUnique.mockResolvedValue(courseRow({ userId: "user-2" }));

    const response = await request(app)
      .post("/api/courses/course-1/schedule")
      .set("Cookie", AS_USER_1)
      .send({ date: "2026-09-20" });

    expect(response.status).toBe(404);
    expect(prisma.courseSchedule.create).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/courses/schedule/:scheduleId", () => {
  it("내 코스의 일정이면 지우고 204로 답한다", async () => {
    prisma.courseSchedule.findUnique.mockResolvedValue({ ...scheduleRow(), course: { userId: "user-1" } });

    const response = await request(app).delete("/api/courses/schedule/schedule-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(204);
    expect(prisma.courseSchedule.delete).toHaveBeenCalledWith({ where: { id: "schedule-1" } });
  });

  it("남의 일정은 지우지 않고 404다 — 일정 주인은 코스 주인을 따라간다", async () => {
    prisma.courseSchedule.findUnique.mockResolvedValue({ ...scheduleRow(), course: { userId: "user-2" } });

    const response = await request(app).delete("/api/courses/schedule/schedule-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
    expect(prisma.courseSchedule.delete).not.toHaveBeenCalled();
  });

  it("없는 일정도 같은 404다", async () => {
    prisma.courseSchedule.findUnique.mockResolvedValue(null);

    const response = await request(app).delete("/api/courses/schedule/없는일정").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
  });
});
