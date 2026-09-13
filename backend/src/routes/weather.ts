import { Router } from "express";
import { fetchDaejeonForecast } from "../lib/weather";

const router = Router();

// GET /api/weather?lat=36.35&lng=127.38 — 생략하면 대전시청 좌표 기준 단기예보
router.get("/", async (req, res) => {
  const lat = req.query.lat ? Number(req.query.lat) : undefined;
  const lng = req.query.lng ? Number(req.query.lng) : undefined;

  try {
    const { district, forecast } = await fetchDaejeonForecast(lat, lng);
    res.json({ district, forecast });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "날씨 정보를 불러오지 못했어요" });
  }
});

export default router;
