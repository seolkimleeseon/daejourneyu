import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAEJEON_OPEN_API_DATASETS, type DaejeonOpenApiDataset } from "./daejeonOpenApi";

const fetchMock = vi.fn();

/** 캐시가 모듈 전역 Map(TTL 1시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadOpenApi() {
  vi.resetModules();
  return import("./daejeonOpenApi");
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("데이터셋 표", () => {
  it("모든 데이터셋이 경로·오퍼레이션·이름을 갖춘다", () => {
    for (const [name, dataset] of Object.entries(DAEJEON_OPEN_API_DATASETS)) {
      expect(dataset.path, name).toBeTruthy();
      expect(dataset.operation, name).toBeTruthy();
      expect(dataset.label, name).toBeTruthy();
    }
  });

  it("오퍼레이션 이름은 경로 앞에 get을 붙인 꼴이다 — 이 계열 API의 규칙이다", () => {
    for (const [name, dataset] of Object.entries(DAEJEON_OPEN_API_DATASETS)) {
      expect(dataset.operation, name).toBe(`get${dataset.path}`);
    }
  });

  it("경로가 서로 겹치지 않는다 — 겹치면 다른 데이터셋을 부르게 된다", () => {
    const paths = Object.values(DAEJEON_OPEN_API_DATASETS).map((dataset) => dataset.path);

    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe("호출", () => {
  it("열쇠가 없으면 어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await expect(fetchDaejeonOpenApi("culture")).rejects.toThrow(/backend\/.env/);
  });

  it("데이터셋마다 제 경로로 물어본다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("restaurant");

    expect(String(fetchMock.mock.lastCall?.[0])).toContain("/openapi2022/restrnt/getrestrnt?");
  });

  it("여섯 데이터셋 모두 제 주소로 나간다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    for (const name of Object.keys(DAEJEON_OPEN_API_DATASETS) as DaejeonOpenApiDataset[]) {
      await fetchDaejeonOpenApi(name);
      const { path, operation } = DAEJEON_OPEN_API_DATASETS[name];
      expect(String(fetchMock.mock.lastCall?.[0]), name).toContain(`/${path}/${operation}?`);
    }
  });

  it("쪽 번호와 개수를 넘기지 않으면 1쪽 20건으로 물어본다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("culture");

    const url = String(fetchMock.mock.lastCall?.[0]);
    expect(url).toContain("pageNo=1");
    expect(url).toContain("numOfRows=20");
  });

  it("넘긴 쪽 번호와 개수를 그대로 싣는다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("culture", { pageNo: 3, numOfRows: 200 });

    const url = String(fetchMock.mock.lastCall?.[0]);
    expect(url).toContain("pageNo=3");
    expect(url).toContain("numOfRows=200");
  });

  it("응답 JSON을 그대로 돌려준다 — 해석은 호출부 몫이다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await expect(fetchDaejeonOpenApi("culture")).resolves.toEqual({ ok: true });
  });
});

describe("캐시", () => {
  it("같은 데이터셋·같은 쪽은 한 번만 물어본다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("culture", { numOfRows: 200 });
    await fetchDaejeonOpenApi("culture", { numOfRows: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("데이터셋이 다르면 따로 물어본다 — 캐시 열쇠가 섞이면 엉뚱한 목록이 온다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("culture", { numOfRows: 200 });
    await fetchDaejeonOpenApi("lodging", { numOfRows: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("개수가 다르면 따로 물어본다", async () => {
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await fetchDaejeonOpenApi("culture", { numOfRows: 20 });
    await fetchDaejeonOpenApi("culture", { numOfRows: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("실패", () => {
  it("응답이 실패면 상태 코드까지 담아 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500, statusText: "Internal Server Error" }));
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await expect(fetchDaejeonOpenApi("culture")).rejects.toThrow(/500/);
  });

  it("JSON이 아니면 원문 앞부분을 보여준다 — 서비스키 오류는 200 + XML로 온다", async () => {
    fetchMock.mockResolvedValue(
      new Response("<OpenAPI_ServiceResponse><errMsg>SERVICE KEY IS NOT REGISTERED ERROR</errMsg>", {
        status: 200,
      })
    );
    const { fetchDaejeonOpenApi } = await loadOpenApi();

    await expect(fetchDaejeonOpenApi("culture")).rejects.toThrow(/SERVICE KEY IS NOT REGISTERED/);
  });
});
