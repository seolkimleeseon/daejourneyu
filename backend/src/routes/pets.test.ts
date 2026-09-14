import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    pet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));
vi.mock("../lib/prisma", () => ({ prisma }));
vi.mock("../lib/auth", async () => {
  const { fakeAuthModule } = await import("../test/testApp");
  return fakeAuthModule();
});

import petsRouter from "./pets";
import { asUser, createTestApp } from "../test/testApp";

const app = createTestApp("/api/pets", petsRouter);
const AS_USER_1 = asUser("user-1");

const VALID_INPUT = {
  name: "콩이",
  breed: "말티즈",
  weightKg: 3.2,
  ageYears: 4,
  size: "소형견",
  emoji: "🐕",
};

function petRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "pet-1",
    userId: "user-1",
    name: "콩이",
    breed: "말티즈",
    weightKg: 3.2,
    ageYears: 4,
    size: "소형견",
    emoji: "🐕",
    mbtiCode: null,
    mbtiName: null,
    mbtiTheme: null,
    mbtiTraits: [],
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

const VALID_MBTI = {
  code: "ENFP",
  name: "호기심 탐험가",
  theme: "산책",
  traits: ["활발함", "사람 좋아함"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/pets", () => {
  it("로그인하지 않으면 401", async () => {
    const response = await request(app).get("/api/pets");

    expect(response.status).toBe(401);
    expect(prisma.pet.findMany).not.toHaveBeenCalled();
  });

  it("내 반려동물만 등록 순으로 준다", async () => {
    prisma.pet.findMany.mockResolvedValue([petRow()]);

    const response = await request(app).get("/api/pets").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(prisma.pet.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "asc" },
    });
    expect(response.body.pets[0]).toEqual({
      id: "pet-1",
      name: "콩이",
      breed: "말티즈",
      weightKg: 3.2,
      ageYears: 4,
      size: "소형견",
      emoji: "🐕",
    });
  });

  it("퀴즈를 안 봤으면 mbti 키 자체를 내보내지 않는다", async () => {
    prisma.pet.findMany.mockResolvedValue([petRow()]);

    const response = await request(app).get("/api/pets").set("Cookie", AS_USER_1);

    expect("mbti" in response.body.pets[0]).toBe(false);
  });

  it("퀴즈 결과가 있으면 컬럼 4개를 중첩 객체로 묶어 준다", async () => {
    prisma.pet.findMany.mockResolvedValue([
      petRow({
        mbtiCode: "ENFP",
        mbtiName: "호기심 탐험가",
        mbtiTheme: "산책",
        mbtiTraits: ["활발함"],
      }),
    ]);

    const response = await request(app).get("/api/pets").set("Cookie", AS_USER_1);

    expect(response.body.pets[0].mbti).toEqual({
      code: "ENFP",
      name: "호기심 탐험가",
      theme: "산책",
      traits: ["활발함"],
    });
  });
});

describe("POST /api/pets", () => {
  it("정상 입력은 내 소유로 만들고 201", async () => {
    prisma.pet.count.mockResolvedValue(0);
    prisma.pet.create.mockResolvedValue(petRow());

    const response = await request(app).post("/api/pets").set("Cookie", AS_USER_1).send(VALID_INPUT);

    expect(response.status).toBe(201);
    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", name: "콩이" }),
    });
  });

  it("이름·견종의 앞뒤 공백은 잘라서 저장한다", async () => {
    prisma.pet.count.mockResolvedValue(0);
    prisma.pet.create.mockResolvedValue(petRow());

    await request(app)
      .post("/api/pets")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, name: "  콩이  ", breed: " 말티즈 " });

    expect(prisma.pet.create.mock.calls[0][0].data).toMatchObject({
      name: "콩이",
      breed: "말티즈",
    });
  });

  it("나이는 정수로 잘라 저장한다", async () => {
    prisma.pet.count.mockResolvedValue(0);
    prisma.pet.create.mockResolvedValue(petRow());

    await request(app)
      .post("/api/pets")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, ageYears: 4.7 });

    expect(prisma.pet.create.mock.calls[0][0].data.ageYears).toBe(4);
  });

  it.each([
    ["이름 없음", { name: "" }, "name"],
    ["견종 없음", { breed: "  " }, "breed"],
    ["몸무게 0 이하", { weightKg: 0 }, "weightKg"],
    ["오타로 과한 몸무게", { weightKg: 2800 }, "weightKg"],
    ["음수 나이", { ageYears: -1 }, "ageYears"],
    ["없는 크기", { size: "초대형견" }, "size"],
    ["목록에 없는 아바타", { emoji: "🦖" }, "emoji"],
  ])("%s는 400으로 막는다", async (_label, patch, field) => {
    const response = await request(app)
      .post("/api/pets")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, ...patch });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty(field);
    expect(prisma.pet.create).not.toHaveBeenCalled();
  });

  it("한도(10마리)를 넘기면 400", async () => {
    prisma.pet.count.mockResolvedValue(10);

    const response = await request(app).post("/api/pets").set("Cookie", AS_USER_1).send(VALID_INPUT);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("최대 10마리");
    expect(prisma.pet.create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/pets/:petId", () => {
  it("내 반려동물만 수정할 수 있다 — 소유자까지 조건에 넣는다", async () => {
    prisma.pet.findFirst.mockResolvedValue(petRow());
    prisma.pet.update.mockResolvedValue(petRow({ name: "콩순이" }));

    const response = await request(app)
      .patch("/api/pets/pet-1")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_INPUT, name: "콩순이" });

    expect(response.status).toBe(200);
    expect(prisma.pet.findFirst).toHaveBeenCalledWith({
      where: { id: "pet-1", userId: "user-1" },
    });
    expect(response.body.pet.name).toBe("콩순이");
  });

  it("남의 반려동물이면 404", async () => {
    prisma.pet.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .patch("/api/pets/pet-9")
      .set("Cookie", AS_USER_1)
      .send(VALID_INPUT);

    expect(response.status).toBe(404);
    expect(prisma.pet.update).not.toHaveBeenCalled();
  });

  it("폼 저장이 MBTI 컬럼을 건드리지 않는다 — 퀴즈 결과가 날아가면 안 된다", async () => {
    prisma.pet.findFirst.mockResolvedValue(petRow({ mbtiCode: "ENFP" }));
    prisma.pet.update.mockResolvedValue(petRow({ mbtiCode: "ENFP" }));

    await request(app).patch("/api/pets/pet-1").set("Cookie", AS_USER_1).send(VALID_INPUT);

    expect(Object.keys(prisma.pet.update.mock.calls[0][0].data)).toEqual([
      "name",
      "breed",
      "weightKg",
      "ageYears",
      "size",
      "emoji",
    ]);
  });
});

describe("PUT /api/pets/:petId/mbti", () => {
  it("퀴즈 결과를 저장하고 갱신된 반려동물을 돌려준다", async () => {
    prisma.pet.findFirst.mockResolvedValue(petRow());
    prisma.pet.update.mockResolvedValue(
      petRow({
        mbtiCode: "ENFP",
        mbtiName: "호기심 탐험가",
        mbtiTheme: "산책",
        mbtiTraits: ["활발함", "사람 좋아함"],
      })
    );

    const response = await request(app)
      .put("/api/pets/pet-1/mbti")
      .set("Cookie", AS_USER_1)
      .send(VALID_MBTI);

    expect(response.status).toBe(200);
    expect(prisma.pet.update.mock.calls[0][0].data).toEqual({
      mbtiCode: "ENFP",
      mbtiName: "호기심 탐험가",
      mbtiTheme: "산책",
      mbtiTraits: ["활발함", "사람 좋아함"],
    });
    expect(response.body.pet.mbti.code).toBe("ENFP");
  });

  it.each([
    ["형식이 아닌 코드", { code: "XXXX" }],
    ["빈 유형 이름", { name: "" }],
    ["목록에 없는 테마", { theme: "쇼핑" }],
    ["문자열이 아닌 성향", { traits: [1, 2] }],
    ["너무 많은 성향", { traits: Array.from({ length: 11 }, (_, i) => `t${i}`) }],
  ])("%s는 400으로 막는다", async (_label, patch) => {
    const response = await request(app)
      .put("/api/pets/pet-1/mbti")
      .set("Cookie", AS_USER_1)
      .send({ ...VALID_MBTI, ...patch });

    expect(response.status).toBe(400);
    expect(prisma.pet.update).not.toHaveBeenCalled();
  });

  it("남의 반려동물에는 결과를 심을 수 없다", async () => {
    prisma.pet.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .put("/api/pets/pet-9/mbti")
      .set("Cookie", AS_USER_1)
      .send(VALID_MBTI);

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/pets/:petId", () => {
  it("내 반려동물이면 지우고 204", async () => {
    prisma.pet.findFirst.mockResolvedValue(petRow());
    prisma.pet.delete.mockResolvedValue(petRow());

    const response = await request(app).delete("/api/pets/pet-1").set("Cookie", AS_USER_1);

    expect(response.status).toBe(204);
    expect(prisma.pet.delete).toHaveBeenCalledWith({ where: { id: "pet-1" } });
  });

  it("남의 반려동물은 지울 수 없다", async () => {
    prisma.pet.findFirst.mockResolvedValue(null);

    const response = await request(app).delete("/api/pets/pet-9").set("Cookie", AS_USER_1);

    expect(response.status).toBe(404);
    expect(prisma.pet.delete).not.toHaveBeenCalled();
  });

  it("로그인하지 않으면 401", async () => {
    const response = await request(app).delete("/api/pets/pet-1");

    expect(response.status).toBe(401);
  });
});
