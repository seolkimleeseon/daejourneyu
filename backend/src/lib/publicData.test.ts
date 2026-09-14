import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPublicDataApiKey,
  extractItems,
  fetchPublicDataJson,
  type PublicDataEnvelope,
} from "./publicData";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.PUBLIC_DATA_API_KEY = "public-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function envelope(items: unknown): PublicDataEnvelope<{ name: string }> {
  return {
    response: {
      header: { resultCode: "00", resultMsg: "NORMAL SERVICE" },
      body: { items, numOfRows: 10, pageNo: 1, totalCount: 1 },
    },
  } as PublicDataEnvelope<{ name: string }>;
}

describe("assertPublicDataApiKey", () => {
  it("키가 있으면 돌려준다", () => {
    expect(assertPublicDataApiKey()).toBe("public-key");
  });

  it("없으면 어디에 넣어야 하는지까지 알려준다", () => {
    delete process.env.PUBLIC_DATA_API_KEY;

    expect(() => assertPublicDataApiKey()).toThrow(/backend\/.env/);
  });
});

describe("extractItems", () => {
  it("표준 봉투(items.item)에서 배열을 꺼낸다", () => {
    expect(extractItems(envelope({ item: [{ name: "한밭수목원" }] }))).toEqual([
      { name: "한밭수목원" },
    ]);
  });

  it("items가 이미 배열인 API도 있다", () => {
    expect(extractItems(envelope([{ name: "한밭수목원" }]))).toEqual([{ name: "한밭수목원" }]);
  });

  it("결과가 없을 때 빈 문자열을 주는 API도 빈 배열로 맞춘다", () => {
    // 결과 0건이면 items: "" 를 주는 API가 있다 — 그대로 두면 호출부에서 터진다.
    expect(extractItems(envelope(""))).toEqual([]);
  });

  it("item 키가 아예 없어도 빈 배열", () => {
    expect(extractItems(envelope({} as { item: { name: string }[] }))).toEqual([]);
  });
});

describe("fetchPublicDataJson", () => {
  it("JSON을 파싱해 돌려준다", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    expect(await fetchPublicDataJson("https://api.example.com")).toEqual({ ok: true });
  });

  it("HTTP 실패는 상태 코드와 함께 던진다", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 503, statusText: "Unavailable" }));

    await expect(fetchPublicDataJson("https://api.example.com")).rejects.toThrow(
      /요청 실패: 503/
    );
  });

  it("200인데 XML이 오면 원문을 잘라 보여준다 — 서비스키 오류가 이렇게 온다", async () => {
    const xml =
      "<OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg></cmmMsgHeader></OpenAPI_ServiceResponse>";
    fetchMock.mockResolvedValue(new Response(xml, { status: 200 }));

    await expect(fetchPublicDataJson("https://api.example.com")).rejects.toThrow(
      /SERVICE_KEY_IS_NOT_REGISTERED_ERROR/
    );
  });

  it("원문이 아주 길어도 앞부분만 메시지에 담는다", async () => {
    fetchMock.mockResolvedValue(new Response("x".repeat(5000), { status: 200 }));

    await expect(fetchPublicDataJson("https://api.example.com")).rejects.toThrow(
      /^공공데이터포털 응답이 JSON이 아니에요: x{200}$/
    );
  });
});
