import { describe, expect, it } from "vitest";
import { GEMINI_MODELS, gemini } from "./gemini";

/*
 * 키가 비어 있어도 클라이언트 생성 자체는 던지지 않아야 한다 — 파일 주석대로 "실제 호출 시점에
 * 인증 에러로 실패하게 두고, 라우트에서 그걸 잡아 안내 메시지로 바꾼다"가 의도다. 이게 깨지면
 * GEMINI_API_KEY가 없는 환경에서 서버가 아예 못 뜬다.
 */
describe("Gemini 클라이언트", () => {
  it("키가 없어도 모듈을 불러오는 것만으로 터지지 않는다", () => {
    expect(gemini).toBeDefined();
  });

  it("쓸 모델을 정해 둔다 — 라우트마다 다른 모델을 쓰지 않게", () => {
    expect(GEMINI_MODELS.length).toBeGreaterThan(0);
    expect(GEMINI_MODELS.every((model) => typeof model === "string" && model.length > 0)).toBe(true);
  });

  it("붐빌 때 갈아탈 모델을 하나 이상 남겨둔다 — 목록이 한 종류면 503에 그대로 막힌다", () => {
    expect(new Set(GEMINI_MODELS).size).toBeGreaterThan(1);
  });
});
