import { Router } from "express";
import { fetchDaejeonCampgrounds } from "../lib/campgrounds";

const router = Router();

// GET /api/campgrounds
router.get("/", async (_req, res) => {
  try {
    const campgrounds = await fetchDaejeonCampgrounds();
    res.json({ campgrounds });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "캠핑장 정보를 불러오지 못했어요" });
  }
});

export default router;
