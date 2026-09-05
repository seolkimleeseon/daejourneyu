import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/places?district=서구&category=산책&source=petacp — backend/scripts/syncPlaces.ts로 채워진 Place 테이블을 읽는다.
// source는 syncPlaces.ts가 정규화 단계에서 붙이는 출처 태그(예: "petacp"=문체부 반려동물 동반가능
// 시설 현황)로, 특정 소스 하나만 골라 보여줘야 하는 화면(홈 혼잡도 랜덤 추천 등)에서 쓴다.
router.get("/", async (req, res) => {
  const { district, category, source } = req.query;
  const places = await prisma.place.findMany({
    where: {
      ...(typeof district === "string" ? { district } : {}),
      ...(typeof category === "string" ? { category } : {}),
      ...(typeof source === "string" ? { source } : {}),
    },
    orderBy: [{ sourceTier: "asc" }, { name: "asc" }],
  });
  res.json(places);
});

// GET /api/places/:id
router.get("/:id", async (req, res) => {
  const place = await prisma.place.findUnique({ where: { id: req.params.id } });
  if (!place) return res.status(404).json({ error: "not found" });
  res.json(place);
});

export default router;
