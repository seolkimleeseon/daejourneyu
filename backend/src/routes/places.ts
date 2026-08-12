import { Router } from "express";

type Place = { id: number; name: string; cat: string; gu: string; pet: boolean };

// 임시 데이터 (추후 DB 연동 — Prisma/PostgreSQL 권장)
const PLACES: Place[] = [
  { id: 1, name: "갑천 자연생태공원", cat: "산책", gu: "서구", pet: true },
  { id: 2, name: "한밭수목원", cat: "산책", gu: "서구", pet: true },
  { id: 3, name: "성심당 본점", cat: "맛집", gu: "중구", pet: false },
  { id: 4, name: "테미오래", cat: "문화", gu: "중구", pet: true },
];

const router = Router();

// GET /api/places?gu=서구&cat=산책
router.get("/", (req, res) => {
  const { gu, cat } = req.query;
  let result = PLACES;
  if (gu) result = result.filter((p) => p.gu === gu);
  if (cat) result = result.filter((p) => p.cat === cat);
  res.json(result);
});

// GET /api/places/:id
router.get("/:id", (req, res) => {
  const place = PLACES.find((p) => p.id === Number(req.params.id));
  if (!place) return res.status(404).json({ error: "not found" });
  res.json(place);
});

export default router;
