import { Router } from "express";
import { searchKakaoPlaces } from "../lib/kakaoLocal";

const router = Router();

// GET /api/kakao-places?query=대전 유성구 카페&size=15
router.get("/", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query : "";
  if (!query) {
    res.status(400).json({ error: "query 파라미터가 필요해요" });
    return;
  }

  try {
    const places = await searchKakaoPlaces(query, req.query.size ? Number(req.query.size) : undefined);
    res.json({ places });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "카카오 장소 검색에 실패했어요" });
  }
});

export default router;
