import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { optionalAuth } from "../middleware/optionalAuth";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

/** 아티클 id는 프론트 목데이터 키("article-1")라 형식만 느슨하게 본다. 길이·문자를 제한해 이상한 값이 쌓이지 않게 한다. */
const ARTICLE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

// GET /api/articles/likes — 아티클별 '도움돼요' 수와, 로그인했다면 내가 누른 아티클 id 목록.
// 아티클 본문·기본 수는 프론트 목데이터라 여기서는 실제 사용자가 누른 수만 돌려준다.
router.get("/likes", optionalAuth, asyncHandler(async (req, res) => {
  const [grouped, mine] = await Promise.all([
    prisma.articleLike.groupBy({ by: ["articleId"], _count: { articleId: true } }),
    req.userId
      ? prisma.articleLike.findMany({ where: { userId: req.userId }, select: { articleId: true } })
      : Promise.resolve([]),
  ]);

  const counts: Record<string, number> = {};
  for (const row of grouped) counts[row.articleId] = row._count.articleId;

  res.json({ counts, likedIds: mine.map((row) => row.articleId) });
}));

// PUT /api/articles/:id/like — 도움돼요를 누른다. 이미 눌렀어도 같은 결과(멱등)라 연타·재시도에 안전하다.
router.put("/:id/like", requireAuth, asyncHandler(async (req, res) => {
  const articleId = req.params.id;
  if (!ARTICLE_ID_PATTERN.test(articleId)) {
    return res.status(400).json({ error: "아티클 주소가 올바르지 않아요" });
  }

  await prisma.articleLike.upsert({
    where: { userId_articleId: { userId: req.userId!, articleId } },
    update: {},
    create: { userId: req.userId!, articleId },
  });
  const count = await prisma.articleLike.count({ where: { articleId } });

  res.json({ articleId, liked: true, count });
}));

// DELETE /api/articles/:id/like — 도움돼요를 취소한다. 누른 적이 없어도 성공으로 본다(멱등).
router.delete("/:id/like", requireAuth, asyncHandler(async (req, res) => {
  const articleId = req.params.id;
  if (!ARTICLE_ID_PATTERN.test(articleId)) {
    return res.status(400).json({ error: "아티클 주소가 올바르지 않아요" });
  }

  await prisma.articleLike.deleteMany({ where: { userId: req.userId!, articleId } });
  const count = await prisma.articleLike.count({ where: { articleId } });

  res.json({ articleId, liked: false, count });
}));

export default router;
