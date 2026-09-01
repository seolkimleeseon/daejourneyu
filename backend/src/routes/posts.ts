import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { optionalAuth } from "../middleware/optionalAuth";

type PostStop = {
  placeId: string;
  name: string;
  category: string;
  district: string;
  condition: string;
  petFriendly: boolean;
  imageUrl?: string | null;
};

/** 프론트 src/types/feed.ts 의 FeedPost와 필드명을 맞춘다 — 화면에서 변환 없이 그대로 쓴다. */
type FeedPost = {
  id: string;
  authorName: string;
  authorEmoji: string;
  petTypeName: string;
  isMine: boolean;
  caption: string;
  text: string;
  stops: PostStop[];
  courseId?: string;
  tags: string[];
  likes: number;
  liked: boolean;
  saves: number;
  saved: boolean;
};

const postWithRelations = {
  stops: { orderBy: { order: "asc" as const } },
};

type PostRow = Prisma.PostGetPayload<{ include: typeof postWithRelations }>;

function toFeedPost(row: PostRow, viewerId: string | undefined): FeedPost {
  return {
    id: row.id,
    authorName: row.authorName,
    authorEmoji: row.authorEmoji,
    petTypeName: row.petTypeName,
    isMine: viewerId !== undefined && row.userId === viewerId,
    caption: row.caption,
    text: row.text,
    stops: row.stops.map((s) => ({
      placeId: s.placeId,
      name: s.name,
      category: s.category,
      district: s.district,
      condition: s.condition,
      petFriendly: s.petFriendly,
      imageUrl: s.imageUrl,
    })),
    ...(row.courseId ? { courseId: row.courseId } : {}),
    tags: row.tags,
    likes: row.likes,
    // TODO(api): 좋아요/담기 토글이 서버로 넘어오기 전까지는 항상 false로 내려간다(프론트가 로컬 상태로 덮어씀).
    liked: false,
    saves: row.saves,
    saved: false,
  };
}

function isValidStop(s: unknown): s is PostStop {
  if (typeof s !== "object" || s === null) return false;
  const stop = s as PostStop;
  if (typeof stop.placeId !== "string") return false;
  if (typeof stop.name !== "string") return false;
  if (typeof stop.category !== "string") return false;
  if (typeof stop.district !== "string") return false;
  if (typeof stop.condition !== "string") return false;
  if (typeof stop.petFriendly !== "boolean") return false;
  if (stop.imageUrl !== undefined && stop.imageUrl !== null && typeof stop.imageUrl !== "string") return false;
  return true;
}

type PostCreateInput = {
  caption: string;
  text: string;
  stops: PostStop[];
  tags: string[];
  authorName: string;
  authorEmoji: string;
  petTypeName: string;
  courseId?: string;
};

function validatePostInput(body: unknown): body is PostCreateInput {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.caption !== "string" || b.caption.trim().length === 0) return false;
  if (typeof b.text !== "string") return false;
  if (typeof b.authorName !== "string" || b.authorName.trim().length === 0) return false;
  if (typeof b.authorEmoji !== "string" || b.authorEmoji.length === 0) return false;
  if (typeof b.petTypeName !== "string") return false;
  if (b.courseId !== undefined && typeof b.courseId !== "string") return false;
  if (!Array.isArray(b.tags) || !b.tags.every((tag) => typeof tag === "string")) return false;
  // 방문 장소가 없는 글은 '코스 게시물'이 아니다 — 둘러보기 카드가 동선을 전제로 그려진다.
  return Array.isArray(b.stops) && b.stops.length > 0 && b.stops.every(isValidStop);
}

const router = Router();

// GET /api/posts — 둘러보기 목록. 비로그인도 볼 수 있고, 로그인했으면 내 글에 isMine이 붙는다.
router.get("/", optionalAuth, async (req, res) => {
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: postWithRelations,
  });
  res.json(rows.map((row) => toFeedPost(row, req.userId)));
});

// POST /api/posts — 코스 자랑하기. 로그인 필요.
router.post("/", requireAuth, async (req, res) => {
  if (!validatePostInput(req.body)) {
    return res.status(400).json({ error: "게시물 형식이 올바르지 않아요" });
  }
  const input = req.body;

  if (input.courseId) {
    // 남의 코스를 내 글로 올릴 수 없다. 코스가 이미 지워졌으면 연결만 비우고 글은 그대로 올린다.
    const course = await prisma.course.findUnique({ where: { id: input.courseId } });
    if (course && course.userId !== req.userId) {
      return res.status(403).json({ error: "내 코스만 자랑할 수 있어요" });
    }
    if (!course) input.courseId = undefined;
  }

  const created = await prisma.post.create({
    data: {
      caption: input.caption,
      text: input.text,
      tags: input.tags,
      authorName: input.authorName,
      authorEmoji: input.authorEmoji,
      petTypeName: input.petTypeName,
      userId: req.userId!,
      courseId: input.courseId ?? null,
      stops: { create: input.stops.map((stop, order) => ({ ...stop, order })) },
    },
    include: postWithRelations,
  });

  res.status(201).json(toFeedPost(created, req.userId));
});

// DELETE /api/posts/:id — 내 글 삭제. 남의 글이면 존재 여부도 알리지 않고 404로 통일한다.
router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "게시물을 찾을 수 없어요" });
  }

  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
