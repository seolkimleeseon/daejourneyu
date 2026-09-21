import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 실제 Gemini를 부르지 않는다 — 클라이언트를 가짜로 바꿔, 어떤 (키, 모델) 조합을 어떤 순서로 부르고
 * 어떤 실패를 어떻게 넘기는지만 본다.
 */
const calls = vi.hoisted(() => ({
  handler: vi.fn(),
  used: [] as { key: string; model: string }[],
}));

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  class FakeGenAI {
    models: { generateContent: (params: { model: string }) => Promise<unknown> };
    constructor(options: { apiKey: string }) {
      this.models = {
        generateContent: async (params: { model: string }) => {
          calls.used.push({ key: options.apiKey, model: params.model });
          return calls.handler(options.apiKey, params.model);
        },
      };
    }
  }
  return { ...actual, GoogleGenAI: FakeGenAI };
});

import { ApiError } from "@google/genai";
import {
  GEMINI_MODELS,
  gemini,
  generateContentWithKeys,
  geminiApiKeys,
  resetGeminiRotation,
} from "./gemini";

const err = (status: number) => new ApiError({ message: `status ${status}`, status });
const OK = { text: "ok" };

beforeEach(() => {
  calls.handler.mockReset();
  calls.used.length = 0;
  resetGeminiRotation();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEYS;
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEYS;
});

describe("Gemini 클라이언트", () => {
  it("키가 없어도 모듈을 불러오는 것만으로 터지지 않는다", () => {
    expect(gemini).toBeDefined();
  });

  it("쓸 모델을 정해 둔다 - 라우트마다 다른 모델을 쓰지 않게", () => {
    expect(GEMINI_MODELS.length).toBeGreaterThan(0);
    expect(GEMINI_MODELS.every((model) => typeof model === "string" && model.length > 0)).toBe(true);
  });

  it("붐빌 때 갈아탈 모델을 하나 이상 남겨둔다 - 목록이 한 종류면 503에 그대로 막힌다", () => {
    expect(new Set(GEMINI_MODELS).size).toBeGreaterThan(1);
  });
});

describe("geminiApiKeys", () => {
  it("콤마로 이은 여러 키를 읽고 공백·빈 값·중복은 버린다", () => {
    process.env.GEMINI_API_KEYS = " k1 , k2,, k1 ,k3 ";

    expect(geminiApiKeys()).toEqual(["k1", "k2", "k3"]);
  });

  it("기존 GEMINI_API_KEY 하나만 있어도 그대로 쓴다", () => {
    process.env.GEMINI_API_KEY = "solo";

    expect(geminiApiKeys()).toEqual(["solo"]);
  });

  it("둘을 함께 주면 합친다", () => {
    process.env.GEMINI_API_KEY = "a";
    process.env.GEMINI_API_KEYS = "b,c";

    expect(geminiApiKeys()).toEqual(["b", "c", "a"]);
  });

  it("아무것도 없으면 빈 목록", () => {
    expect(geminiApiKeys()).toEqual([]);
  });
});

describe("generateContentWithKeys", () => {
  it("첫 조합이 성공하면 거기서 끝낸다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockResolvedValue(OK);

    await expect(generateContentWithKeys({ contents: "x" })).resolves.toEqual(OK);

    expect(calls.used).toEqual([{ key: "k1", model: GEMINI_MODELS[0] }]);
  });

  it("한 키의 한도가 바닥나면(429) 같은 모델을 다음 키로 이어 부른다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockImplementation((key: string) =>
      key === "k1" ? Promise.reject(err(429)) : Promise.resolve(OK)
    );

    await generateContentWithKeys({ contents: "x" });

    expect(calls.used).toEqual([
      { key: "k1", model: GEMINI_MODELS[0] },
      { key: "k2", model: GEMINI_MODELS[0] },
    ]);
  });

  it("모든 키가 한 모델에서 막히면 다음 모델로 넘어간다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockImplementation((_key: string, model: string) =>
      model === GEMINI_MODELS[0] ? Promise.reject(err(429)) : Promise.resolve(OK)
    );

    await generateContentWithKeys({ contents: "x" });

    expect(calls.used.map((c) => c.model)).toEqual([GEMINI_MODELS[0], GEMINI_MODELS[0], GEMINI_MODELS[1]]);
  });

  it("한도가 바닥난 조합은 쉬게 해서 다음 요청에서 헛호출하지 않는다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockImplementation((key: string) =>
      key === "k1" ? Promise.reject(err(429)) : Promise.resolve(OK)
    );

    await generateContentWithKeys({ contents: "x" }); // k1 실패, k2 성공. k1은 쉼
    calls.used.length = 0;
    await generateContentWithKeys({ contents: "x" });

    expect(calls.used.every((c) => c.key === "k2")).toBe(true);
  });

  it("쉬는 시간이 지나면 다시 시도한다", async () => {
    vi.useFakeTimers();
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockImplementation((key: string) =>
      key === "k1" ? Promise.reject(err(429)) : Promise.resolve(OK)
    );
    await generateContentWithKeys({ contents: "x" });
    calls.used.length = 0;
    calls.handler.mockResolvedValue(OK);

    vi.advanceTimersByTime(6 * 60_000);
    await generateContentWithKeys({ contents: "x" });
    await generateContentWithKeys({ contents: "x" });

    expect(calls.used.some((c) => c.key === "k1")).toBe(true);
  });

  it("요청마다 시작 키를 옮겨 키들이 고르게 쓰인다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2,k3";
    calls.handler.mockResolvedValue(OK);

    for (let i = 0; i < 3; i++) await generateContentWithKeys({ contents: "x" });

    expect(calls.used.map((c) => c.key)).toEqual(["k1", "k2", "k3"]);
  });

  it("잘못된 키(401)는 그 키만 버리고 다른 키로 계속한다", async () => {
    process.env.GEMINI_API_KEYS = "bad,good";
    calls.handler.mockImplementation((key: string) =>
      key === "bad" ? Promise.reject(err(401)) : Promise.resolve(OK)
    );

    await expect(generateContentWithKeys({ contents: "x" })).resolves.toEqual(OK);
  });

  it("전부 실패했는데 429가 섞여 있으면 429를 던진다 - 마지막 503에 원인이 가려지지 않게", async () => {
    process.env.GEMINI_API_KEYS = "k1";
    calls.handler.mockImplementation((_key: string, model: string) =>
      Promise.reject(err(model === GEMINI_MODELS[GEMINI_MODELS.length - 1] ? 503 : 429))
    );

    await expect(generateContentWithKeys({ contents: "x" })).rejects.toMatchObject({ status: 429 });
  });

  it("전부 붐비기만 하면 503을 던진다", async () => {
    process.env.GEMINI_API_KEYS = "k1";
    calls.handler.mockRejectedValue(err(503));

    await expect(generateContentWithKeys({ contents: "x" })).rejects.toMatchObject({ status: 503 });
  });

  it("모든 조합이 쉬는 중이면 호출 없이 쉬는 이유에 맞는 오류를 던진다", async () => {
    process.env.GEMINI_API_KEYS = "k1";
    calls.handler.mockRejectedValue(err(429));
    await expect(generateContentWithKeys({ contents: "x" })).rejects.toMatchObject({ status: 429 });
    calls.used.length = 0;

    await expect(generateContentWithKeys({ contents: "x" })).rejects.toMatchObject({ status: 429 });

    expect(calls.used).toHaveLength(0);
  });

  it("다시 불러도 소용없는 오류(예: 400)는 돌리지 않고 바로 던진다", async () => {
    process.env.GEMINI_API_KEYS = "k1,k2";
    calls.handler.mockRejectedValue(err(400));

    await expect(generateContentWithKeys({ contents: "x" })).rejects.toMatchObject({ status: 400 });
    expect(calls.used).toHaveLength(1);
  });
});
