import { Router } from "express";
import { fetchDaejeonPetFacilities } from "../lib/petFacilities";

const router = Router();

// GET /api/pet-facilities
router.get("/", async (_req, res) => {
  try {
    const facilities = await fetchDaejeonPetFacilities();
    res.json({ facilities });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "반려동물 동반 시설 정보를 불러오지 못했어요" });
  }
});

export default router;
