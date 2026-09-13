import { Router } from "express";
import {
  fetchDaejeonCultureFacilities,
  fetchDaejeonLodgings,
  fetchDaejeonTourspots,
  fetchDaejeonExemplaryRestaurants,
} from "../lib/daejeonPlaces";

const router = Router();

const FETCHERS = {
  culture: fetchDaejeonCultureFacilities,
  lodging: fetchDaejeonLodgings,
  tourspot: fetchDaejeonTourspots,
  restaurant: fetchDaejeonExemplaryRestaurants,
} as const;

// GET /api/daejeon-places/:type(culture|lodging|tourspot|restaurant)
router.get("/:type", async (req, res) => {
  const type = req.params.type;
  if (!(type in FETCHERS)) {
    res.status(400).json({ error: `알 수 없는 타입이에요. 가능한 값: ${Object.keys(FETCHERS).join(", ")}` });
    return;
  }

  try {
    const places = await FETCHERS[type as keyof typeof FETCHERS]();
    res.json({ places });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "대전시 데이터를 불러오지 못했어요" });
  }
});

export default router;
