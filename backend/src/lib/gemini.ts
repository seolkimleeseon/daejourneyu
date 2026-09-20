import { GoogleGenAI } from "@google/genai";

// GEMINI_API_KEY가 비어있어도 생성 자체는 에러 내지 않는다 — 실제 호출 시점에
// 인증 에러로 실패하게 두고, 라우트에서 그걸 잡아 안내 메시지로 바꾼다.
// 발급: https://aistudio.google.com/apikey (무료 티어 — 분당·일일 요청 한도가 있고, 인기 모델은 붐비면 503으로 거절한다).
export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/**
 * 코스 추천처럼 가벼운 JSON 생성에 쓰는 모델. 앞에서부터 쓰고, 그 모델이 붐비면(503) 다음으로 내려간다.
 *
 * 최신 flash(3.6·3.7)는 무료 티어에서 "This model is currently experiencing high demand"(503)로
 * 튕겨내는 일이 잦다 — 같은 요청을 3번씩 넣어 보면 3.6은 2번, 3.7은 2번 실패하는데 3.5는 3번 다
 * 성공했다. 그래서 3.5를 앞에 두고, 붐빌 때만 뒤로 내려간다(세 모델이 동시에 붐비는 일은 드물다).
 *
 * lite 계열은 1초대로 빠르지만 후보에서 뺐다 — responseType을 course로 골라 놓고 days 대신
 * message에 이모지를 쏟아내는 식으로 새서, 걸러내면 결국 "응답을 이해하지 못했어요"가 된다.
 * 2.5 계열은 신규 키에 더 이상 열리지 않는다(404).
 */
export const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"] as const;

