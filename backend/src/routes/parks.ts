import { Router } from "express";
import { fetchDaejeonParks } from "../lib/parks";

const router = Router();

// GET /api/parks?numOfRows=50&pageNo=1
router.get("/", async (req, res) => {
  try {
    const parks = await fetchDaejeonParks(
      req.query.numOfRows ? Number(req.query.numOfRows) : undefined,
      req.query.pageNo ? Number(req.query.pageNo) : undefined
    );
    res.json({ parks });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "공원 정보를 불러오지 못했어요" });
  }
});

export default router;
