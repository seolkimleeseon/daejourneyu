import { Router } from "express";
import { ApiError, Type } from "@google/genai";
import { gemini, GEMINI_MODEL } from "../lib/gemini";

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

  const placeIds = [...new Set(candidatePlaces.filter((place: CandidatePlace) => place.petFriendly).map((place: CandidatePlace) => place.id))];
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

  const placesDescription = candidatePlaces.filter((place: CandidatePlace) => place.petFriendly)
    .map(
      (place) =>
        `- ${place.id}: ${place.name} (${place.district} · ${place.category} · 동반가능 · ${place.condition}${place.lat === undefined ? "" : ` · ${place.lat},${place.lng}`})`
    )
    .join("\n");

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
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
          "사용자의 취향과 방문 조건을 먼저 지켜줘.",
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    const parsed = sanitizeResponse(JSON.parse(text), validIds, dayCount);
    if (!parsed) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    if (parsed.responseType === "chat") {
      return res.json({ responseType: "chat" as const, message: parsed.message });
    }

    const byId = new Map(candidatePlaces.map((place) => [place.id, place]));
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
    if (error instanceof SyntaxError) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }
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
