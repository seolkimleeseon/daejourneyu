import { Router } from "express";
import { fetchDaejeonFestivals } from "../lib/festivals";

const router = Router();

// GET /api/festivals — 대전 지역 일반 축제(한국관광공사 KorService2 searchFestival2)
router.get("/", async (_req, res) => {
  try {
    const festivals = await fetchDaejeonFestivals();
    res.json({ festivals });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "축제 정보를 불러오지 못했어요" });
  }
});

export default router;
