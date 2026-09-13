import { Router } from "express";
import { fetchVerifiedPetRestaurants } from "../lib/verifiedPetRestaurants";

const router = Router();

// GET /api/verified-pet-restaurants
router.get("/", async (_req, res) => {
  try {
    const restaurants = await fetchVerifiedPetRestaurants();
    res.json({ restaurants });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "인증 맛집 정보를 불러오지 못했어요" });
  }
});

export default router;
