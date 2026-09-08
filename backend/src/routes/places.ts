import { Router } from "express";
import { cached } from "../lib/cache";
import { fetchAggregatedPlaces } from "../lib/placesAggregator";

const router = Router();

// 여러 공공데이터 API를 매 요청마다 그대로 호출하면(관광공사·식약처 등은 일일 호출 한도가 있고,
// 소스가 여러 개라 응답도 느려진다) 순식간에 한도를 소진하거나 화면이 느려진다. 실제 데이터는
// 분 단위로 바뀌지 않으므로 짧은 TTL로 캐시해 같은 창 안의 여러 요청이 호출을 공유하게 한다 —
// DB 스냅샷이 아니라 API 응답 자체를 잠깐 담아두는 것뿐이라 "그때그때 실시간 호출" 요건은 유지된다.
const CACHE_TTL_MS = 5 * 60 * 1000;

// GET /api/places?district=서구&category=산책 — 공공데이터 API를 실시간 호출해 만든 목록에서 필터링한다.
router.get("/", async (req, res) => {
  const { district, category } = req.query;
  const places = await cached("places:all", CACHE_TTL_MS, fetchAggregatedPlaces);
  const filtered = places
    .filter((place) => (typeof district === "string" ? place.district === district : true))
    .filter((place) => (typeof category === "string" ? place.category === category : true))
    .sort((a, b) => a.sourceTier - b.sourceTier || a.name.localeCompare(b.name));
  res.json(filtered);
});

// GET /api/places/:id
router.get("/:id", async (req, res) => {
  const places = await cached("places:all", CACHE_TTL_MS, fetchAggregatedPlaces);
  const place = places.find((p) => p.id === req.params.id);
  if (!place) return res.status(404).json({ error: "not found" });
  res.json(place);
});

export default router;
