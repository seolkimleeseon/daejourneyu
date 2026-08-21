import { assertPublicDataApiKey, fetchPublicDataJson } from "./publicData";
import { cached } from "./cache";

/** 대전광역시 openapi2022 계열 — 문화시설/숙박/쇼핑/식당/관광지/축제. */
export const DAEJEON_OPEN_API_DATASETS = {
  culture: { path: "ctlstt", operation: "getctlstt", label: "문화시설" },
  lodging: { path: "tourroms", operation: "gettourroms", label: "숙박(문화관광)" },
  shopping: { path: "shppg", operation: "getshppg", label: "쇼핑" },
  restaurant: { path: "restrnt", operation: "getrestrnt", label: "모범음식점" },
  tourspot: { path: "tourspot", operation: "gettourspot", label: "관광지" },
  festival: { path: "festv", operation: "getfestv", label: "문화축제" },
} as const;

export type DaejeonOpenApiDataset = keyof typeof DAEJEON_OPEN_API_DATASETS;

interface FetchOptions {
  pageNo?: number;
  numOfRows?: number;
}

export async function fetchDaejeonOpenApi(dataset: DaejeonOpenApiDataset, options: FetchOptions = {}): Promise<unknown> {
  const key = assertPublicDataApiKey();
  const { path, operation } = DAEJEON_OPEN_API_DATASETS[dataset];
  const pageNo = options.pageNo ?? 1;
  const numOfRows = options.numOfRows ?? 20;

  return cached(`daejeon:${dataset}:${pageNo}:${numOfRows}`, 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      pageNo: String(pageNo),
      numOfRows: String(numOfRows),
    });
    const url = `https://apis.data.go.kr/6300000/openapi2022/${path}/${operation}?${search.toString()}`;
    return fetchPublicDataJson<unknown>(url);
  });
}
