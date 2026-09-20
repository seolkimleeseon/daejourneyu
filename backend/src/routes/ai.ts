import { Router } from "express";
import { ApiError, Type } from "@google/genai";
import { gemini, GEMINI_MODELS } from "../lib/gemini";
import { bakeryBrandKey } from "../lib/bakeries";

type Transport = "자차" | "대중교통";
const TRANSPORTS: Transport[] = ["자차", "대중교통"];

type CandidatePlace = {
  id: string;
  name: string;
  category: string;
  district: string;
  condition: string;
  petFriendly: boolean;
  lat?: number;
  lng?: number;
};

const MAX_DAY_ROUTE_KM = 16;
const MAX_LEG_KM = 10;

function distanceKm(a: CandidatePlace, b: CandidatePlace): number | null {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) return null;
  const rad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** 장소가 최대 5곳이라 가능한 순서를 모두 비교할 수 있다. 좌표가 없으면 AI의 순서를 유지한다. */
function shortestDayRoute(places: CandidatePlace[]): CandidatePlace[] {
  if (places.some((place) => place.lat === undefined || place.lng === undefined)) return places;
  let best = places;
  let bestDistance = Infinity;
  const visit = (route: CandidatePlace[], rest: CandidatePlace[], distance: number) => {
    if (distance >= bestDistance) return;
    if (rest.length === 0) {
      best = route;
      bestDistance = distance;
      return;
    }
    rest.forEach((place, index) => visit(
      [...route, place], [...rest.slice(0, index), ...rest.slice(index + 1)],
      distance + (route.length ? distanceKm(route[route.length - 1], place)! : 0)
    ));
  };
  visit([], places, 0);
  return best;
}

function routeIsNear(route: CandidatePlace[]): boolean {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const leg = distanceKm(route[i - 1], route[i]);
    if (leg === null) continue;
    if (leg > MAX_LEG_KM) return false;
    total += leg;
  }
  return total <= MAX_DAY_ROUTE_KM;
}

function isValidCandidatePlace(p: unknown): p is CandidatePlace {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as CandidatePlace).id === "string" &&
    typeof (p as CandidatePlace).name === "string" &&
    typeof (p as CandidatePlace).category === "string" &&
    typeof (p as CandidatePlace).district === "string" &&
    typeof (p as CandidatePlace).condition === "string" &&
    typeof (p as CandidatePlace).petFriendly === "boolean" &&
    ((p as CandidatePlace).lat === undefined && (p as CandidatePlace).lng === undefined ||
      Number.isFinite((p as CandidatePlace).lat) && Number.isFinite((p as CandidatePlace).lng))
  );
}

interface SuggestionRequest {
  prompt: string;
  nights: number;
  transport: Transport;
  candidatePlaces: CandidatePlace[];
}

function validateRequest(body: unknown): body is SuggestionRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.prompt !== "string" || b.prompt.trim().length === 0) return false;
  if (!Number.isInteger(b.nights) || (b.nights as number) < 0 || (b.nights as number) > 4) return false;
  if (!TRANSPORTS.includes(b.transport as Transport)) return false;
  if (!Array.isArray(b.candidatePlaces) || b.candidatePlaces.length === 0) return false;
  return b.candidatePlaces.length <= 80 && b.candidatePlaces.every(isValidCandidatePlace) &&
    b.candidatePlaces.filter((place: CandidatePlace) => place.petFriendly).length >= 2;
}

function isAllowedForPrompt(place: CandidatePlace, prompt: string): boolean {
  return place.petFriendly || (/빵지순례|빵집|베이커리|제과점/.test(prompt) &&
    place.id.startsWith("bakery-") && place.condition.includes("동반 가능 여부는 방문 전 매장에 확인해주세요"));
}

function matchesCourseIntent(days: string[][], byId: Map<string, CandidatePlace>, prompt: string): boolean {
  const bakeryIntent = /빵지순례|빵집|베이커리|제과점/.test(prompt);
  if (bakeryIntent) return days.every((day) =>
    new Set(day.filter((id) => id.startsWith("bakery-")).map((id) => bakeryBrandKey(byId.get(id)!.name))).size >= 2 &&
    day.some((id) => {
      const place = byId.get(id);
      return place?.petFriendly && (place.category === "산책" || place.category === "놀이터");
    })
  );

  // 한 종류만 명시한 요청은 그대로 존중한다. 일반 코스는 가능한 한 매일 식사 장소를 포함한다.
  if (/(?:산책|놀이터|문화|맛집|카페)(?:만|만으로|만 해|만 보여)/.test(prompt)) return true;
  return days.every((day) => day.some((id) => byId.get(id)?.category === "맛집"));
}

interface ParsedSuggestion {
  label: string;
  days: string[][];
}

/** AI가 목록에 없는 id를 지어내거나 개수를 안 지키는 경우에 대비해, 응답을 그대로 믿지 않고 걸러낸다. */
function sanitizeSuggestion(raw: unknown, validIds: Set<string>, dayCount: number): ParsedSuggestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.label !== "string" || !r.label.trim() || !Array.isArray(r.days) || r.days.length !== dayCount) return null;

  const used = new Set<string>();
  const days: string[][] = [];
  for (const rawDay of r.days) {
    if (!Array.isArray(rawDay)) return null;
    const day: string[] = [];
    for (const id of rawDay) {
      if (typeof id !== "string" || !validIds.has(id) || used.has(id)) continue;
      used.add(id);
      day.push(id);
      if (day.length === 5) break;
    }
    if (day.length < 2) return null;
    days.push(day);
  }
  return { label: r.label.trim(), days };
}

/** 모델이 JSON이 아닌 답을 줄 수도 있다 — 던지는 대신 null로 돌려서 "다시 물어보기" 판단에 태운다. */
function parseJsonOrNull(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type ParsedResponse = { responseType: "chat"; message: string } | { responseType: "course"; suggestion: ParsedSuggestion };

/** 응답이 잡담(chat)인지 코스 추천(course)인지 먼저 가르고, course면 기존 검증을 그대로 태운다. */
function sanitizeResponse(raw: unknown, validIds: Set<string>, dayCount: number): ParsedResponse | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  if (r.responseType === "chat") {
    if (typeof r.message !== "string" || r.message.trim().length === 0) return null;
    return { responseType: "chat", message: r.message };
  }
  if (r.responseType === "course") {
    const suggestion = sanitizeSuggestion(r, validIds, dayCount);
    if (!suggestion) return null;
    return { responseType: "course", suggestion };
  }
  return null;
}

/**
 * 모델 하나가 막혔다고 바로 포기하지 않고 다음 모델로 갈아탄다. 두 가지를 넘긴다 —
 * 503(UNAVAILABLE, "high demand": 그 모델이 붐빔)과 429(RESOURCE_EXHAUSTED: 그 모델의 한도 초과).
 *
 * 429까지 갈아타는 이유: 무료 티어의 분당 요청 한도(RPM)는 프로젝트 단위로 세되 **모델 변형마다
 * 따로** 걸린다(ai.google.dev/gemini-api/docs/rate-limits). 그래서 3.5가 한도에 걸려도 3.6·3.7은
 * 아직 남아 있는 경우가 많고, 목록만큼 한도가 늘어나는 셈이 된다. 새 API 키를 발급하는 건 소용이
 * 없다 — 한도는 키가 아니라 프로젝트에 붙는다.
 *
 * 키 문제(401·403)는 다시 불러도 같은 답이라 그대로 던진다. 한 바퀴만 도는 것도 의도다 —
 * 답이 늦으면 화면이 먼저 포기한다(챗봇 25초).
 */
type GenerateParams = Parameters<typeof gemini.models.generateContent>[0];

async function generateWithFallback(params: Omit<GenerateParams, "model">) {
  const models = [...GEMINI_MODELS];
  for (let attempt = 0; attempt < models.length; attempt++) {
    try {
      return await gemini.models.generateContent({ ...params, model: models[attempt] });
    } catch (error) {
      const blocked = error instanceof ApiError && (error.status === 503 || error.status === 429);
      if (!blocked || attempt === models.length - 1) throw error;
    }
  }
  // GEMINI_MODELS가 비어 있을 수 없으므로 여기까지 오지 않는다 — 타입을 좁히기 위한 줄이다.
  throw new Error("생성할 모델이 없습니다");
}




const router = Router();

// POST /api/ai/course-suggestion — 자연어 요청 + 후보 장소 목록을 받아 AI가 일차별 동선을 짜준다.
// 후보 장소는 프론트가 이미 들고 있는 실데이터를 그대로 보낸다(백엔드 places.ts는 아직 스텁이라 미신뢰).
// Gemini(무료 티어) 사용 — 발급: https://aistudio.google.com/apikey
router.post("/course-suggestion", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았어요. backend/.env를 확인해주세요" });
  }
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: "요청 형식이 올바르지 않아요" });
  }
  const { prompt, nights, transport, candidatePlaces } = req.body;

  const placeIds = [...new Set(candidatePlaces.filter((place: CandidatePlace) => isAllowedForPrompt(place, prompt)).map((place: CandidatePlace) => place.id))];
  const validIds = new Set(placeIds);
  const dayCount = nights + 1;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      responseType: {
        type: Type.STRING,
        enum: ["chat", "course"],
        description:
          "사용자가 장소·코스 추천을 원하면 course, 서비스 설명이나 인사 등 일반 대화면 chat.",
      },
      message: {
        type: Type.STRING,
        description: "responseType이 chat일 때만 채운다. 사용자에게 보여줄 자연스러운 답변.",
      },
      label: {
        type: Type.STRING,
        description: "responseType이 course일 때만 채운다. 코스 이름. 15자 이내, 반려동물과 어울리는 감성으로.",
      },
      days: {
        type: Type.ARRAY,
        description: `responseType이 course일 때만 채운다. 정확히 ${dayCount}일치 동선. 각 원소는 candidatePlaces의 id만 사용한다.`,
        minItems: String(dayCount),
        maxItems: String(dayCount),
        items: {
          type: Type.ARRAY,
          minItems: "2",
          maxItems: "5",
          items: { type: Type.STRING, enum: placeIds },
        },
      },
    },
    required: ["responseType"],
  };

  const placesDescription = candidatePlaces.filter((place: CandidatePlace) => isAllowedForPrompt(place, prompt))
    .map(
      (place) =>
        `- ${place.id}: ${place.name} (${place.district} · ${place.category} · ${place.petFriendly ? "동반가능" : "동반 여부 미확인"} · ${place.condition}${place.lat === undefined ? "" : ` · ${place.lat},${place.lng}`})`
    )
    .join("\n");

  try {
    /* 스키마로 모양을 묶어놔도 모델이 가끔 샌다 — responseType은 course라고 해놓고 days 대신
       message에 인사말만 채워 보내는 식이다. 걸러낸 결과가 비면 오류를 보이기 전에 한 번 더 물어본다. */
    let parsed: ParsedResponse | null = null;
    for (let attempt = 0; attempt < 2 && parsed === null; attempt++) {
      const response = await generateWithFallback({
        contents: `요청: ${prompt}\n\n이동수단: ${transport}\n일수: ${dayCount}일\n\n후보 장소 목록:\n${placesDescription}`,
        config: {
          systemInstruction:
            "너는 '대저니유' 앱의 AI 안내이자 반려동물 동반 여행 코스 추천 어시스턴트야. " +
            "대저니유는 대전 5개 구(유성구·중구·동구·대덕구·서구)의 반려동물 동반 여행지를 소개하고 " +
            "코스로 묶어주는 앱이고, 코스는 내 여정 탭에서 MBTI 추천·AI 추천(지금 이 대화)·직접 짓기 중 하나로 만든다. " +
            "사용자의 메시지가 서비스 설명, 인사, 잡담처럼 장소·코스 추천과 무관하면 " +
            "반드시 responseType을 chat으로 하고 message에 짧고 친근하게 답해 — 이때는 절대 코스를 지어내지 마. " +
            "사용자가 실제로 갈 곳이나 코스를 원할 때만 responseType을 course로 하고, " +
            "아래 후보 장소 목록에 있는 id만 사용해서 하루 2~5곳씩 동선을 짜. " +
            "목록에 없는 장소를 지어내면 안 돼. 여러 날에 같은 장소를 반복하지 마. " +
            "하루 이동은 직선거리 합계 16km 이내, 한 구간은 10km 이내로 묶어. " +
            "산책 코스나 문화 코스처럼 테마가 있어도 산책·놀이터·맛집·문화를 가능한 범위에서 섞고, 매일 식사할 곳을 포함해. " +
            "사용자가 명시적으로 한 종류의 장소만 요청한 경우에는 그 요청을 우선해. " +
            "빵지순례 요청이면 bakery- id인 빵집 2~3곳을 가까운 산책 장소와 함께 고르고, 빵집의 반려동물 동반 여부는 반드시 확인 필요하다고 안내해. " +
            "사용자의 취향과 방문 조건을 먼저 지켜줘.",
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const text = response.text;
      parsed = text ? sanitizeResponse(parseJsonOrNull(text), validIds, dayCount) : null;
    }
    if (!parsed) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    if (parsed.responseType === "chat") {
      return res.json({ responseType: "chat" as const, message: parsed.message });
    }

    const byId = new Map(candidatePlaces.map((place) => [place.id, place]));
    if (!matchesCourseIntent(parsed.suggestion.days, byId, prompt)) {
      return res.status(502).json({ error: "요청한 테마에 맞는 코스를 만들지 못했어요. 다시 시도해주세요" });
    }
    const routedDays = parsed.suggestion.days.map((day) => shortestDayRoute(day.map((placeId) => byId.get(placeId)!)));
    if (routedDays.some((day) => !routeIsNear(day))) {
      return res.status(502).json({ error: "가까운 장소로 코스를 만들지 못했어요. 지역이나 조건을 바꿔 다시 시도해주세요" });
    }
    const days = routedDays.map((day) =>
      day.map((place) => {
        return {
          placeId: place.id,
          name: place.name,
          category: place.category,
          district: place.district,
          condition: place.condition,
          petFriendly: place.petFriendly,
        };
      })
    );

    res.json({
      responseType: "course" as const,
      label: parsed.suggestion.label,
      nights,
      transport,
      source: "ai" as const,
      shared: false,
      days,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 올바르지 않아요. backend/.env를 확인해주세요" });
      }
      if (error.status === 429) {
        return res.status(429).json({ error: "요청이 많아요. 잠시 후 다시 시도해주세요(무료 티어는 분당 요청 한도가 있어요)" });
      }
      console.error("AI 코스 추천 API 오류:", error.message);
      return res.status(502).json({ error: "AI 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요" });
    }
    throw error;
  }
});

export default router;
