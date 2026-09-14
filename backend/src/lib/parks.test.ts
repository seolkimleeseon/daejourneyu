import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 실제 응답 스키마를 상상해 고정하지 않는다 — parks.ts가 이미 타입(RawParkItem)으로 못박아 둔
 * 모양을 그대로 쓰고, 여기서 보는 건 "그 모양이 들어오면 무엇으로 바꾸는가"다.
 * 이 소스는 _type=json을 줘도 XML로만 답한다는 게 코드 주석에 적혀 있어 XML로 흉내 낸다.
 */
const fetchMock = vi.fn();

const kakao = vi.hoisted(() => ({ supplementImagesByName: vi.fn() }));
vi.mock("./kakaoLocal", () => ({ supplementImagesByName: kakao.supplementImagesByName }));

/** 캐시가 모듈 전역 Map(TTL 24시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadParks() {
  vi.resetModules();
  return import("./parks");
}

function park(overrides: Record<string, string> = {}) {
  const merged = {
    ntatcSeq: "1",
    title: "한밭수목원",
    address: "대전광역시 서구 둔산대로 169",
    section: "근린공원",
    latitude: "36.3669",
    longitude: "127.3886",
    ...overrides,
  };
  return `<items>${Object.entries(merged)
    .map(([k, v]) => `<${k}>${v}</${k}>`)
    .join("")}</items>`;
}

function giveXml(items: string) {
  fetchMock.mockImplementation(async () => (
    new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<ServiceResult>
  <comMsgHeader><returnCode>00</returnCode><returnMessage>정상</returnMessage></comMsgHeader>
  <msgHeader><numOfRows>50</numOfRows><pageNo>1</pageNo><totalCount>1</totalCount></msgHeader>
  <MsgBody>${items}</MsgBody>
</ServiceResult>`,
      { status: 200, headers: { "Content-Type": "application/xml" } }
    )
  ));
}

beforeEach(() => {
  fetchMock.mockReset();
  kakao.supplementImagesByName.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
  // 사진 보충은 kakaoLocal 쪽 테스트가 따로 본다 — 여기선 받은 목록을 그대로 흘려보낸다.
  kakao.supplementImagesByName.mockImplementation(async (list: unknown[]) => list);
  giveXml(park());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("열쇠가 없을 때", () => {
  it("어디에 넣어야 하는지까지 알려준다", async () => {
    delete process.env.PUBLIC_DATA_API_KEY;
    const { fetchDaejeonParks } = await loadParks();

    await expect(fetchDaejeonParks()).rejects.toThrow(/backend\/.env/);
  });
});

describe("공원 정보로 바꾸기", () => {
  it("응답 항목을 화면이 쓰는 모양으로 옮긴다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    const [first] = await fetchDaejeonParks();

    expect(first).toMatchObject({
      name: "한밭수목원",
      address: "대전광역시 서구 둔산대로 169",
      section: "근린공원",
      lat: 36.3669,
      lng: 127.3886,
      imageUrl: null,
    });
  });

  it("원본 일련번호를 id로 삼는다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    const [first] = await fetchDaejeonParks();

    // XML 파서가 숫자로 읽어 내려와 타입 선언(string)과는 어긋나 있다 —
    // 지금은 호출부가 `park-${id}`로 끼워 쓰기만 해서 드러나지 않는다.
    expect(String(first.id)).toBe("1");
  });

  it("이름에 낀 고정폭 공백 패딩을 접는다 — 원본에 '중   리'처럼 온다", async () => {
    giveXml(park({ title: "중   리   공원" }));
    const { fetchDaejeonParks } = await loadParks();

    const [first] = await fetchDaejeonParks();

    expect(first.name).toBe("중 리 공원");
  });

  it("좌표가 숫자가 아니면 버린다 — 지도에 못 꽂는 공원이다", async () => {
    giveXml(
      park({ ntatcSeq: "1", title: "좌표없음", latitude: "정보없음", longitude: "정보없음" }) +
        park({ ntatcSeq: "2" })
    );
    const { fetchDaejeonParks } = await loadParks();

    const parks = await fetchDaejeonParks();

    expect(parks.map((p) => p.name)).toEqual(["한밭수목원"]);
  });

  it("좌표 칸이 비어 있어도 버린다 — Number(\"\")가 0이라 0,0에 꽂히던 자리다", async () => {
    giveXml(park({ ntatcSeq: "1", title: "빈좌표", latitude: "", longitude: "" }) + park({ ntatcSeq: "2" }));
    const { fetchDaejeonParks } = await loadParks();

    const parks = await fetchDaejeonParks();

    expect(parks.map((p) => p.name)).toEqual(["한밭수목원"]);
  });

  it("좌표가 0으로 와도 버린다 — 대전에 0,0은 없다", async () => {
    giveXml(park({ title: "영점좌표", latitude: "0", longitude: "0" }));
    const { fetchDaejeonParks } = await loadParks();

    await expect(fetchDaejeonParks()).resolves.toEqual([]);
  });

  it("한 건만 와도 목록으로 다룬다 — XML→JSON 변환이 단일 항목을 객체로 만든다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await expect(fetchDaejeonParks()).resolves.toHaveLength(1);
  });

  it("여러 건도 순서대로 옮긴다", async () => {
    giveXml(park({ ntatcSeq: "1", title: "한밭수목원" }) + park({ ntatcSeq: "2", title: "보라매공원" }));
    const { fetchDaejeonParks } = await loadParks();

    const parks = await fetchDaejeonParks();

    expect(parks.map((p) => p.name)).toEqual(["한밭수목원", "보라매공원"]);
  });

  it("본문이 비어 있어도 빈 목록으로 돌려준다 — 던지지 않는다", async () => {
    giveXml("");
    const { fetchDaejeonParks } = await loadParks();

    await expect(fetchDaejeonParks()).resolves.toEqual([]);
  });
});

describe("요청과 실패", () => {
  it("쪽 번호와 개수를 그대로 실어 보낸다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await fetchDaejeonParks(20, 3);

    const url = String(fetchMock.mock.lastCall?.[0]);
    expect(url).toContain("numOfRows=20");
    expect(url).toContain("pageNo=3");
    expect(url).toContain("serviceKey=public-key");
  });

  it("같은 쪽은 한 번만 물어본다 — 일일 한도가 있다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await fetchDaejeonParks(50, 1);
    await fetchDaejeonParks(50, 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("쪽이 다르면 따로 물어본다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await fetchDaejeonParks(50, 1);
    await fetchDaejeonParks(50, 2);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("응답이 실패면 상태 코드까지 담아 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 503, statusText: "Service Unavailable" }));
    const { fetchDaejeonParks } = await loadParks();

    await expect(fetchDaejeonParks()).rejects.toThrow(/503/);
  });
});

describe("사진 보충", () => {
  it("이름과 공원 종류를 함께 넘겨 검색한다 — '한밭수목원'만으론 엉뚱한 사진이 걸린다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await fetchDaejeonParks();

    const [list, buildQuery] = kakao.supplementImagesByName.mock.lastCall as [
      unknown[],
      (park: { name: string; section: string }) => string,
      number,
    ];
    expect(list).toHaveLength(1);
    expect(buildQuery({ name: "한밭수목원", section: "근린공원" })).toBe("대전 한밭수목원근린공원");
  });

  it("한 번에 채우는 장수에 상한을 둔다 — 카카오 호출이 그만큼 늘어난다", async () => {
    const { fetchDaejeonParks } = await loadParks();

    await fetchDaejeonParks();

    expect(kakao.supplementImagesByName.mock.lastCall?.[2]).toBe(80);
  });
});
