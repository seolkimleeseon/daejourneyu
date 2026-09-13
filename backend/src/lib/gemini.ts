import { GoogleGenAI } from "@google/genai";

// GEMINI_API_KEY가 비어있어도 생성 자체는 에러 내지 않는다 — 실제 호출 시점에
// 인증 에러로 실패하게 두고, 라우트에서 그걸 잡아 안내 메시지로 바꾼다.
// 발급: https://aistudio.google.com/apikey (무료 티어 — Gemini 2.5 Flash 기준 분당/일일 요청 한도 있음).
export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/** 코스 추천처럼 가벼운 JSON 생성에 쓰는 기본 모델. 무료 티어 대상 모델 중 품질 대비 속도가 좋다.
 * gemini-2.5-flash는 신규 사용자에게 더 이상 제공되지 않아(API가 404로 안내) 3.6으로 올렸다. */
export const GEMINI_MODEL = "gemini-3.6-flash";
