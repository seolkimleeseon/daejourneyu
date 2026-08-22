import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type Transport = "자차" | "대중교통";
type CourseSource = "ai" | "manual" | "saved";

type CourseStop = {
  placeId: string;
  name: string;
  category: string;
  district: string;
  condition: string;
  petFriendly: boolean;
};

type Course = {
  id: string;
  label: string;
  /** 티켓 카드 대표 이모지. 사용자가 직접 고르지 않았으면 null. */
  emoji: string | null;
  nights: number;
  transport: Transport;
  source: CourseSource;
  shared: boolean;
  days: CourseStop[][];
};

// TODO(auth): 로그인이 없어 모든 코스를 이 시드 사용자 소유로 취급한다. NextAuth 연동 시 세션에서 가져온다.
const MOCK_USER_ID = "user-1";

const courseWithRelations = {
  days: {
    orderBy: { dayIndex: "asc" as const },
    include: { stops: { orderBy: { order: "asc" as const } } },
  },
};

type CourseRow = Prisma.CourseGetPayload<{ include: typeof courseWithRelations }>;

function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    label: row.label,
    emoji: row.emoji,
    nights: row.nights,
    transport: row.transport as Transport,
    source: row.source as CourseSource,
    shared: row.shared,
    days: row.days.map((day) =>
      day.stops.map((s) => ({
        placeId: s.placeId,
        name: s.name,
        category: s.category,
        district: s.district,
        condition: s.condition,
        petFriendly: s.petFriendly,
      }))
    ),
  };
}

const TRANSPORTS: Transport[] = ["자차", "대중교통"];
const SOURCES: CourseSource[] = ["ai", "manual", "saved"];

function isValidStop(s: unknown): s is CourseStop {
  return (
    typeof s === "object" &&
    s !== null &&
    typeof (s as CourseStop).placeId === "string" &&
    typeof (s as CourseStop).name === "string" &&
    typeof (s as CourseStop).category === "string" &&
    typeof (s as CourseStop).district === "string" &&
    typeof (s as CourseStop).condition === "string" &&
    typeof (s as CourseStop).petFriendly === "boolean"
  );
}

function isValidDays(days: unknown): days is CourseStop[][] {
  return Array.isArray(days) && days.length > 0 && days.every((day) => Array.isArray(day) && day.every(isValidStop));
}

function validateCourseInput(body: unknown): body is Omit<Course, "id"> {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.label !== "string" || b.label.trim().length === 0) return false;
  if (b.emoji !== undefined && b.emoji !== null && typeof b.emoji !== "string") return false;
  if (typeof b.nights !== "number" || b.nights < 0) return false;
  if (!TRANSPORTS.includes(b.transport as Transport)) return false;
  if (!SOURCES.includes(b.source as CourseSource)) return false;
  if (typeof b.shared !== "boolean") return false;
  return isValidDays(b.days);
}

// PATCH는 label/emoji/days 중 보내진 필드만 검증한다(부분 수정).
function validateCourseUpdateInput(
  body: unknown
): body is Partial<Pick<Course, "label" | "emoji" | "days">> {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.label !== undefined && (typeof b.label !== "string" || b.label.trim().length === 0)) return false;
  if (b.emoji !== undefined && b.emoji !== null && typeof b.emoji !== "string") return false;
  if (b.days !== undefined && !isValidDays(b.days)) return false;
  return true;
}

const router = Router();

// GET /api/courses — 내 코스 보관함 전체 목록
router.get("/", async (_req, res) => {
  const rows = await prisma.course.findMany({
    where: { userId: MOCK_USER_ID },
    orderBy: { createdAt: "asc" },
    include: courseWithRelations,
  });
  res.json(rows.map(toCourse));
});

// GET /api/courses/:id — 코스 상세
router.get("/:id", async (req, res) => {
  const row = await prisma.course.findUnique({
    where: { id: req.params.id },
    include: courseWithRelations,
  });
  if (!row) return res.status(404).json({ error: "코스를 찾을 수 없어요" });
  res.json(toCourse(row));
});

// POST /api/courses — 코스 위저드(MBTI/직접 짓기)에서 만든 코스를 저장
router.post("/", async (req, res) => {
  if (!validateCourseInput(req.body)) {
    return res.status(400).json({ error: "코스 형식이 올바르지 않아요" });
  }
  const input = req.body;

  const created = await prisma.course.create({
    data: {
      label: input.label,
      emoji: input.emoji ?? null,
      nights: input.nights,
      transport: input.transport,
      source: input.source,
      shared: input.shared,
      userId: MOCK_USER_ID,
      days: {
        create: input.days.map((stops, dayIndex) => ({
          dayIndex,
          stops: { create: stops.map((stop, order) => ({ ...stop, order })) },
        })),
      },
    },
    include: courseWithRelations,
  });

  res.status(201).json(toCourse(created));
});

// PATCH /api/courses/:id — 코스 상세에서 이름·대표 이모지·동선(순서/삭제)을 수정
router.patch("/:id", async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "코스를 찾을 수 없어요" });

  if (!validateCourseUpdateInput(req.body)) {
    return res.status(400).json({ error: "코스 수정 형식이 올바르지 않아요" });
  }
  const input = req.body;

  const updated = await prisma.$transaction(async (tx) => {
    if (input.days) {
      // 일차별 동선을 통째로 교체한다 — CourseDay 삭제 시 CourseStop은 cascade로 함께 지워진다.
      await tx.courseDay.deleteMany({ where: { courseId: req.params.id } });
    }
    return tx.course.update({
      where: { id: req.params.id },
      data: {
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
        ...(input.days
          ? {
              days: {
                create: input.days.map((stops, dayIndex) => ({
                  dayIndex,
                  stops: { create: stops.map((stop, order) => ({ ...stop, order })) },
                })),
              },
            }
          : {}),
      },
      include: courseWithRelations,
    });
  });

  res.json(toCourse(updated));
});

// DELETE /api/courses/:id — 보관함에서 코스 삭제
router.delete("/:id", async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "코스를 찾을 수 없어요" });

  await prisma.course.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
