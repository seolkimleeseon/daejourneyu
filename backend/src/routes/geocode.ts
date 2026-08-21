import { Router } from "express";
import { geocodeAddress } from "../lib/kakaoLocal";

const router = Router();

// GET /api/geocode?address=대전광역시 유성구 온천로 9
router.get("/", async (req, res) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  if (!address) {
    res.status(400).json({ error: "address 쿼리 파라미터가 필요해요" });
    return;
  }

  try {
    const point = await geocodeAddress(address);
    if (!point) {
      res.status(404).json({ error: "해당 주소로 좌표를 찾지 못했어요" });
      return;
    }
    res.json(point);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "지오코딩에 실패했어요" });
  }
});

export default router;
