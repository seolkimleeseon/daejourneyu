import request from "supertest";
import { ApiError } from "@google/genai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/testApp";
import router from "./ai";

/*
 * AI가 돌려준 걸 그대로 믿지 않는 게 이 라우트의 핵심이다 — 목록에 없는 id를 지어내거나
 * 개수를 안 지키는 경우를 걸러내고, 남는 게 없으면 코스를 만들지 않는다.
 * Gemini 호출 자체는 목으로 두고, 무엇을 걸러내고 어떤 실패를 어떤 상태 코드로 바꾸는지만 본다.
 */
const genai = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock("../lib/gemini", () => ({
  gemini: { models: { generateContent: genai.generateContent } },
  GEMINI_MODEL: "test-model",
}));

const app = createTestApp("/api/ai", router);

function place(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    name: "한밭수목원",
    category: "산책",
    district: "서구",
    condition: "전 견종",
    petFriendly: true,
    ...overrides,
  };
}

const CANDIDATES = [
  place({ id: "p1", name: "한밭수목원" }),
  place({ id: "p2", name: "댕댕카페", category: "맛집" }),
  place({ id: "p3", name: "시립미술관", category: "문화" }),
  place({ id: "p4", name: "유성공원" }),
];

function body(overrides: Record<string, unknown> = {}) {
  return { prompt: "유성구 산책 코스", nights: 0, transport: "자차", candidatePlaces: CANDIDATES, ...overrides };
}

/** AI가 이렇게 답했다고 둔다. */
function aiReplies(payload: unknown) {
  genai.generateContent.mockResolvedValue({ text: JSON.stringify(payload) });
}

const post = (payload: unknown = body()) => request(app).post("/api/ai/course-suggestion").send(payload);

beforeEach(() => {
  genai.generateContent.mockReset();
  process.env.GEMINI_API_KEY = "gemini-key";
  aiReplies({ responseType: "course", label: "유성 산책", days: [["p1", "p2"]] });
});

afterEach(() => {
  delete process.env.GEMINI_API_KEY;
});

describe("들어오기 전에 막는 것", () => {
  it("키가 없으면 AI를 부르지 않고 어디를 확인해야 하는지 알려준다", async () => {
    delete process.env.GEMINI_API_KEY;

    const response = await post();

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("backend/.env");
    expect(genai.generateContent).not.toHaveBeenCalled();
  });

  it("요청 모양이 틀리면 400으로 막는다 — AI 호출은 돈이 든다", async () => {
    const badBodies = [
      body({ prompt: "" }),
      body({ prompt: "   " }),
      body({ nights: -1 }),
      body({ nights: 1.5 }),
      body({ nights: 5 }),
      body({ transport: "비행기" }),
      body({ candidatePlaces: [] }),
      body({ candidatePlaces: [{ id: "p1", name: "한밭수목원" }] }),
      body({ candidatePlaces: [place({ petFriendly: "예" })] }),
    ];

    for (const payload of badBodies) {
      const response = await post(payload);
      expect(response.status, JSON.stringify(payload).slice(0, 60)).toBe(400);
    }
    expect(genai.generateContent).not.toHaveBeenCalled();
  });
});

describe("잡담으로 답할 때", () => {
  it("코스를 지어내지 않고 말만 돌려준다", async () => {
    aiReplies({ responseType: "chat", message: "대전 반려동물 여행을 도와드려요" });

    const response = await post();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ responseType: "chat", message: "대전 반려동물 여행을 도와드려요" });
  });

  it("할 말이 비어 있으면 잡담으로 치지 않는다", async () => {
    aiReplies({ responseType: "chat", message: "   " });

    const response = await post();

    expect(response.status).toBe(502);
  });
});

describe("코스로 답할 때", () => {
  it("빵지순례에서 미확인 빵집 조건을 유지하고 일반 요청에서는 제외한다", async () => {
    const bakery = place({ id: "bakery-test", name: "동네빵집", category: "맛집", petFriendly: false,
      condition: "빵집 · 반려동물 동반 가능 여부는 방문 전 매장에 확인해주세요" });
    const secondBakery = place({ ...bakery, id: "bakery-other", name: "다른빵집" });
    aiReplies({ responseType: "course", label: "빵지순례", days: [["p1", "bakery-test", "bakery-other"]] });
    const response = await post(body({ prompt: "빵지순례 코스", candidatePlaces: [...CANDIDATES, bakery, secondBakery] }));
    expect(response.status).toBe(200);
    expect(response.body.days[0][1]).toMatchObject({ placeId: "bakery-test", petFriendly: false });
    expect(response.body.days[0][1].condition).toContain("확인해주세요");
    const ordinary = await post(body({ prompt: "산책 코스", candidatePlaces: [...CANDIDATES, bakery, secondBakery] }));
    expect(ordinary.status).toBe(502);
  });
  it("일반 코스에서 식사 장소가 빠졌으면 거절한다", async () => {
    aiReplies({ responseType: "course", label: "산책만", days: [["p1", "p3"]] });
    expect((await post()).status).toBe(502);
  });
  it("빵지순례에 빵집 한 곳만 넣은 응답은 거절한다", async () => {
    const bakery = place({ id: "bakery-test", name: "동네빵집", category: "맛집", petFriendly: false,
      condition: "빵집 · 반려동물 동반 가능 여부는 방문 전 매장에 확인해주세요" });
    aiReplies({ responseType: "course", label: "빵지순례", days: [["p1", "bakery-test"]] });
    expect((await post(body({ prompt: "빵지순례 코스", candidatePlaces: [...CANDIDATES, bakery] }))).status).toBe(502);
  });
  it("빵집 두 지점만 고른 코스도 거절한다", async () => {
    const condition = "빵집 · 반려동물 동반 가능 여부는 방문 전 매장에 확인해주세요";
    const candidates = [
      ...CANDIDATES,
      place({ id: "bakery-1", name: "성심당본점", category: "맛집", condition, petFriendly: false }),
      place({ id: "bakery-2", name: "성심당 대전역점2", category: "맛집", condition, petFriendly: false }),
    ];
    aiReplies({ responseType: "course", label: "빵지순례", days: [["p1", "bakery-1", "bakery-2"]] });
    expect((await post(body({ prompt: "빵지순례 코스", candidatePlaces: candidates }))).status).toBe(502);
  });
  it("id만 받은 동선을 장소 정보로 펼쳐 돌려준다 — 프론트가 이름·조건을 바로 쓴다", async () => {
    const response = await post();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      responseType: "course",
      label: "유성 산책",
      nights: 0,
      transport: "자차",
      source: "ai",
      shared: false,
      days: [
        [
          { placeId: "p1", name: "한밭수목원", category: "산책", district: "서구", condition: "전 견종", petFriendly: true },
          { placeId: "p2", name: "댕댕카페", category: "맛집", district: "서구", condition: "전 견종", petFriendly: true },
        ],
      ],
    });
  });

  it("요청에 실려 온 박 수와 이동수단을 그대로 붙인다 — AI가 정하는 값이 아니다", async () => {
    aiReplies({ responseType: "course", label: "1박 코스", days: [["p1", "p2"], ["p3", "p4"]] });

    const response = await post(body({ nights: 1, transport: "대중교통", candidatePlaces: [
      ...CANDIDATES.filter((candidate) => candidate.id !== "p4"), place({ id: "p4", name: "둘째 날 식당", category: "맛집" }),
    ] }));

    expect(response.body).toMatchObject({ nights: 1, transport: "대중교통" });
    expect(response.body.days).toHaveLength(2);
  });
});

describe("AI 응답을 그대로 믿지 않는다", () => {
  it("좌표가 있으면 이동 거리가 가장 짧은 순서로 정렬한다", async () => {
    aiReplies({ responseType: "course", label: "가까운 코스", days: [["p1", "p3", "p2"]] });
    const response = await post(body({ candidatePlaces: [
      place({ id: "p1", lat: 36.35, lng: 127.38 }),
      place({ id: "p2", category: "맛집", lat: 36.35, lng: 127.39 }),
      place({ id: "p3", lat: 36.35, lng: 127.4 }),
    ] }));
    const ids = response.body.days[0].map((stop: { placeId: string }) => stop.placeId);
    expect(ids).toEqual(["p1", "p2", "p3"]);
  });

  it("최단 순서로도 하루 이동이 너무 길면 추천하지 않는다", async () => {
    aiReplies({ responseType: "course", label: "먼 코스", days: [["p1", "p2"]] });
    const response = await post(body({ candidatePlaces: [
      place({ id: "p1", lat: 36.35, lng: 127.38 }),
      place({ id: "p2", category: "맛집", lat: 36.75, lng: 127.78 }),
    ] }));
    expect(response.status).toBe(502);
    expect(response.body.error).toContain("가까운 장소");
  });

  it("후보 목록에 없는 id는 지워낸다 — AI가 장소를 지어낼 수 있다", async () => {
    aiReplies({ responseType: "course", label: "지어낸 코스", days: [["p1", "없는곳", "p2"]] });

    const response = await post();

    expect(response.body.days[0].map((stop: { placeId: string }) => stop.placeId)).toEqual(["p1", "p2"]);
  });

  it("하루가 빈약하면 박 수가 어긋나므로 코스를 거절한다", async () => {
    aiReplies({ responseType: "course", label: "빈약한 코스", days: [["p1", "없는곳"], ["p3", "p4"]] });

    const response = await post(body({ nights: 1 }));

    expect(response.status).toBe(502);
  });

  it("요청한 일수보다 많아도 코스를 거절한다", async () => {
    aiReplies({ responseType: "course", label: "넘치는 코스", days: [["p1", "p2"], ["p2", "p3"], ["p3", "p1"]] });

    const response = await post(body({ nights: 0 }));

    expect(response.status).toBe(502);
  });

  it("같은 장소를 여러 날에 중복 추천하지 않는다", async () => {
    aiReplies({ responseType: "course", label: "중복 코스", days: [["p1", "p2"], ["p1", "p3"]] });
    const response = await post(body({ nights: 1 }));
    expect(response.status).toBe(502);
  });

  it("동반 불가 장소는 모델이 선택해도 제외한다", async () => {
    aiReplies({ responseType: "course", label: "동반 코스", days: [["p1", "p2", "p4"]] });
    const response = await post(body({ candidatePlaces: [
      place({ id: "p1" }), place({ id: "p2", petFriendly: false }), place({ id: "p4", category: "맛집" }),
    ] }));
    expect(response.body.days[0].map((stop: { placeId: string }) => stop.placeId)).toEqual(["p1", "p4"]);
  });

  it("쓸 만한 날이 하나도 안 남으면 코스를 만들지 않는다", async () => {
    aiReplies({ responseType: "course", label: "전부 지어냄", days: [["없는곳1", "없는곳2"]] });

    const response = await post();

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("AI 응답을 이해하지 못했어요");
  });

  it("모르는 응답 종류는 받아들이지 않는다", async () => {
    aiReplies({ responseType: "뭔가다른것", message: "무시" });

    const response = await post();

    expect(response.status).toBe(502);
  });

  it("코스 이름이 빠져도 받아들이지 않는다", async () => {
    aiReplies({ responseType: "course", days: [["p1", "p2"]] });

    const response = await post();

    expect(response.status).toBe(502);
  });

  it("답이 통째로 비어 있으면 502다", async () => {
    genai.generateContent.mockResolvedValue({ text: "" });

    const response = await post();

    expect(response.status).toBe(502);
  });

  it("JSON이 아닌 답도 502로 받아 넘긴다 — 던져서 500이 되게 두지 않는다", async () => {
    genai.generateContent.mockResolvedValue({ text: "이건 JSON이 아니에요" });

    const response = await post();

    expect(response.status).toBe(502);
  });
});

describe("AI 쪽이 막혔을 때", () => {
  it("키가 잘못됐으면 우리 설정 문제로 알린다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "unauthorized", status: 401 }));

    const response = await post();

    expect(response.status).toBe(500);
    expect(response.body.error).toContain("backend/.env");
  });

  it("권한 오류도 마찬가지로 설정 문제다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "forbidden", status: 403 }));

    const response = await post();

    expect(response.status).toBe(500);
  });

  it("한도를 넘기면 429를 그대로 넘기고 잠시 뒤 다시 하라고 안내한다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "quota", status: 429 }));

    const response = await post();

    expect(response.status).toBe(429);
    expect(response.body.error).toContain("잠시 후");
  });

  it("그 밖의 AI 오류는 502로 묶는다 — 우리 잘못이 아니라 위쪽이 막힌 것이다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "server error", status: 500 }));

    const response = await post();

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("일시적인 문제");
  });
  it("모델이 붐벼서 503이면 몇 번 더 두드려 본다 — 대개 곧 붙는다", async () => {
    genai.generateContent
      .mockRejectedValueOnce(new ApiError({ message: "high demand", status: 503 }))
      .mockResolvedValueOnce({ text: JSON.stringify({ responseType: "course", label: "유성 산책", days: [["p1", "p2"]] }) });

    const response = await post();

    expect(response.status).toBe(200);
    expect(genai.generateContent).toHaveBeenCalledTimes(2);
  });

  it("계속 붐비면 결국 502로 알린다 — 무한정 붙잡고 있지 않는다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "high demand", status: 503 }));

    const response = await post();

    expect(response.status).toBe(502);
    expect(genai.generateContent).toHaveBeenCalledTimes(3);
  });

  it("한도 초과는 다시 부르지 않는다 — 같은 답이 올 뿐이고 한도만 더 깎는다", async () => {
    genai.generateContent.mockRejectedValue(new ApiError({ message: "quota", status: 429 }));

    await post();

    expect(genai.generateContent).toHaveBeenCalledTimes(1);
  });
});


describe("AI에게 넘기는 것", () => {
  it("후보 장소를 동반 가능 여부·조건까지 붙여 알려준다 — 이름만 주면 아무 곳이나 고른다", async () => {
    await post();

    const contents = String(genai.generateContent.mock.lastCall?.[0].contents);
    expect(contents).toContain("p1: 한밭수목원 (서구 · 산책 · 동반가능 · 전 견종)");
    expect(contents).toContain("이동수단: 자차");
    expect(contents).toContain("일수: 1일");
  });

  it("고를 수 있는 id를 응답 스키마에 못박아 둔다 — 지어낼 여지를 줄인다", async () => {
    await post();

    const schema = genai.generateContent.mock.lastCall?.[0].config.responseSchema;
    expect(schema.properties.days.items.items.enum).toEqual(["p1", "p2", "p3", "p4"]);
    expect(schema.properties.days.minItems).toBe("1");
    expect(schema.properties.days.maxItems).toBe("1");
  });
});
