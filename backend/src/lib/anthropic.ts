import Anthropic from "@anthropic-ai/sdk";

// ANTHROPIC_API_KEY가 비어있어도 생성 자체는 에러 내지 않는다 — 실제 호출 시점에
// AuthenticationError로 실패하게 두고, 라우트에서 그걸 잡아 안내 메시지로 바꾼다.
export const anthropic = new Anthropic();
