import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/places?district=서구&category=산책 — backend/scripts/syncPlaces.ts로 채워진 Place 테이블을 읽는다.
router.get("/", async (req, res) => {
  const { district, category } = req.query;
  const places = await prisma.place.findMany({
    where: {
      ...(typeof district === "string" ? { district } : {}),
      ...(typeof category === "string" ? { category } : {}),
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
