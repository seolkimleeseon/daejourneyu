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
  /** ISO 문자열. 최신순 정렬을 서버가 하므로 화면은 표시용으로만 쓴다. */
  createdAt: string;
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
    createdAt: row.createdAt.toISOString(),
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

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function parseLimit(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function firstQueryValue(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return undefined;
}

/**
 * 검색 범위는 프론트가 쓰던 searchPosts와 맞춘다 — 코스 이름·한마디·작성자·태그·방문 장소명.
 * 태그만 부분일치가 아니라 정확일치인데, 태그 값이 "당일치기"·"자차"·"유성구"처럼 고정 어휘라
 * 부분일치가 필요한 자치구 검색은 stops.district가 대신 받는다(Postgres는 String[] 부분검색을 못 한다).
 */
function buildSearchWhere(keyword: string): Prisma.PostWhereInput {
  return {
    OR: [
      { caption: { contains: keyword, mode: "insensitive" } },
      { text: { contains: keyword, mode: "insensitive" } },
      { authorName: { contains: keyword, mode: "insensitive" } },
      { tags: { has: keyword } },
      { stops: { some: { name: { contains: keyword, mode: "insensitive" } } } },
      { stops: { some: { district: { contains: keyword, mode: "insensitive" } } } },
    ],
  };
}

/**
 * GET /api/posts — 둘러보기 목록. 비로그인도 볼 수 있고, 로그인했으면 내 글에 isMine이 붙는다.
 *
 * 검색·유형 필터·정렬을 전부 여기서 처리한다. 예전에는 전체를 내려주고 화면이 걸렀는데,
 * 글이 늘면 그대로 무너지는 구조라 서버로 옮겼다.
 *
 * 페이지네이션은 offset이 아니라 **커서**다 — 담긴순 목록은 순서가 계속 바뀌어서 offset을 쓰면
 * 스크롤 도중 같은 글이 두 번 나오거나 건너뛰어진다. 커서는 마지막 항목의 id이고,
 * 정렬 키에 항상 id를 섞어 순서를 확정한다(동점이어도 페이지 경계가 흔들리지 않게).
 */
router.get("/", optionalAuth, async (req, res) => {
  const keyword = firstQueryValue(req.query.q)?.trim();
  const sameTypeName = firstQueryValue(req.query.sameType)?.trim();
  const sort = firstQueryValue(req.query.sort) === "recent" ? "recent" : "saves";
  const mine = firstQueryValue(req.query.mine) === "true";
  const cursor = firstQueryValue(req.query.cursor);
  const limit = parseLimit(firstQueryValue(req.query.limit));

  if (mine && !req.userId) {
    return res.status(401).json({ error: "로그인이 필요해요" });
  }

  const filters: Prisma.PostWhereInput[] = [];
  if (mine) filters.push({ userId: req.userId! });
  if (keyword) filters.push(buildSearchWhere(keyword));
  // 검색 중에는 유형 필터를 무시한다 — 검색은 항상 전체 코스를 훑는다(프로토타입 동작 유지).
  if (!keyword && sameTypeName) filters.push({ petTypeName: sameTypeName });

  // 커서 글이 지워졌으면 Prisma가 던지므로, 조용히 목록의 끝으로 처리한다.
  if (cursor) {
    const alive = await prisma.post.findUnique({ where: { id: cursor }, select: { id: true } });
    if (!alive) return res.json({ items: [], nextCursor: null });
  }

  const where = filters.length > 0 ? { AND: filters } : undefined;

  const rows = await prisma.post.findMany({
    where,
    orderBy:
      sort === "recent"
        ? [{ createdAt: "desc" }, { id: "desc" }]
        : [{ saves: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: postWithRelations,
  });

  // 마지막 페이지인지는 "요청한 만큼 채워 왔는가"로 판단한다. 딱 떨어지면 다음 요청이 빈 배열로 끝난다.
  const nextCursor = rows.length === limit ? rows[rows.length - 1]!.id : null;
  // 전체 건수는 첫 페이지에서만 센다 — 검색 결과 개수를 보여주는 용도라 이어 받을 때는 필요 없다.
  const total = cursor ? undefined : await prisma.post.count({ where });

  res.json({ items: rows.map((row) => toFeedPost(row, req.userId)), nextCursor, total });
});

/**
 * GET /api/posts/:id — 게시물 하나. 목록이 페이지 단위로 바뀌면서 상세 화면이 목록 캐시에서
 * 글을 못 찾는 경우가 생기므로(딥링크·뒤쪽 페이지) 단건 조회가 필요해졌다.
 */
router.get("/:id", optionalAuth, async (req, res) => {
  const row = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: postWithRelations,
  });
  if (!row) return res.status(404).json({ error: "게시물을 찾을 수 없어요" });
  res.json(toFeedPost(row, req.userId));
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
