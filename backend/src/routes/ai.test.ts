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
    aiReplies({ responseType: "course", label: "1박 코스", days: [["p1", "p2"], ["p3", "p1"]] });

    const response = await post(body({ nights: 1, transport: "대중교통" }));

    expect(response.body).toMatchObject({ nights: 1, transport: "대중교통" });
    expect(response.body.days).toHaveLength(2);
  });
});

describe("AI 응답을 그대로 믿지 않는다", () => {
  it("후보 목록에 없는 id는 지워낸다 — AI가 장소를 지어낼 수 있다", async () => {
    aiReplies({ responseType: "course", label: "지어낸 코스", days: [["p1", "없는곳", "p2"]] });

    const response = await post();

    expect(response.body.days[0].map((stop: { placeId: string }) => stop.placeId)).toEqual(["p1", "p2"]);
  });

  it("지우고 나서 2곳이 안 되는 날은 통째로 버린다 — 한 곳짜리는 동선이 아니다", async () => {
    aiReplies({ responseType: "course", label: "빈약한 코스", days: [["p1", "없는곳"], ["p1", "p2"]] });

    const response = await post(body({ nights: 1 }));

    expect(response.body.days).toHaveLength(1);
    expect(response.body.days[0].map((stop: { placeId: string }) => stop.placeId)).toEqual(["p1", "p2"]);
  });

  it("요청한 일수보다 많이 오면 잘라낸다", async () => {
    aiReplies({ responseType: "course", label: "넘치는 코스", days: [["p1", "p2"], ["p2", "p3"], ["p3", "p1"]] });

    const response = await post(body({ nights: 0 }));

    expect(response.body.days).toHaveLength(1);
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
    expect(schema.properties.days.items.items.enum).toEqual(["p1", "p2", "p3"]);
    expect(schema.properties.days.minItems).toBe("1");
    expect(schema.properties.days.maxItems).toBe("1");
  });
});
