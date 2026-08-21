import { Router } from "express";
import { DAEJEON_OPEN_API_DATASETS, fetchDaejeonOpenApi, type DaejeonOpenApiDataset } from "../lib/daejeonOpenApi";

const router = Router();

// GET /api/daejeon/:dataset(culture|lodging|shopping|restaurant|tourspot|festival)?pageNo=&numOfRows=
router.get("/:dataset", async (req, res) => {
  const dataset = req.params.dataset;
  if (!(dataset in DAEJEON_OPEN_API_DATASETS)) {
    res.status(400).json({
      error: `알 수 없는 데이터셋이에요. 가능한 값: ${Object.keys(DAEJEON_OPEN_API_DATASETS).join(", ")}`,
    });
    return;
  }

  try {
    const data = await fetchDaejeonOpenApi(dataset as DaejeonOpenApiDataset, {
      pageNo: req.query.pageNo ? Number(req.query.pageNo) : undefined,
      numOfRows: req.query.numOfRows ? Number(req.query.numOfRows) : undefined,
    });
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "대전시 데이터를 불러오지 못했어요" });
  }
});

export default router;
