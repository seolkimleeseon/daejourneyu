import { Router } from "express";
import { fetchDaejeonPetTourSpots, type PetTourContentTypeId } from "../lib/petTourSpots";

const VALID_CONTENT_TYPE_IDS: PetTourContentTypeId[] = ["12", "14", "15", "28", "32", "38", "39"];

const router = Router();

/**
 * GET /api/pet-tour-spots?contentTypeId=12&pageNo=1&numOfRows=20 — 대전 반려동물 동반여행지 목록
 * contentTypeId를 생략하면 관광타입별로 numOfRows개씩(기본 12) 최소 개수를 보장해서 섞어 돌려준다.
 */
router.get("/", async (req, res) => {
  const contentTypeIdParam = req.query.contentTypeId as string | undefined;
  const contentTypeId = VALID_CONTENT_TYPE_IDS.includes(contentTypeIdParam as PetTourContentTypeId)
    ? (contentTypeIdParam as PetTourContentTypeId)
    : undefined;

  try {
    const spots = await fetchDaejeonPetTourSpots({
      contentTypeId,
      sigunguCode: (req.query.sigunguCode as string) || undefined,
      pageNo: req.query.pageNo ? Number(req.query.pageNo) : undefined,
      numOfRows: req.query.numOfRows ? Number(req.query.numOfRows) : undefined,
    });
    res.json({ spots });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "반려동물 동반여행지 정보를 불러오지 못했어요" });
  }
});

export default router;
