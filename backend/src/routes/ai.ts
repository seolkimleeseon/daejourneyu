import { Router } from "express";
import { ApiError, Type } from "@google/genai";
import { generateContentWithKeys, geminiApiKeys } from "../lib/gemini";
import { asyncHandler } from "../lib/asyncHandler";
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

/** 식사 장소로 하루를 시작하는 순서에 붙이는 감점(km 환산). 거리가 같다면 산책·놀이로 먼저 시작하게 한다. */
const MEAL_FIRST_PENALTY_KM = 4;

/**
 * 장소가 최대 5곳이라 가능한 순서를 모두 비교할 수 있다. 좌표가 없으면 AI의 순서를 유지한다.
 * 이동 거리가 최우선이되, 왕복이 같은 두 순서 중에는 식사 장소로 시작하지 않는 쪽을 고른다
 * (아침 첫 일정이 식당이면 어색하다).
 */
function shortestDayRoute(places: CandidatePlace[]): CandidatePlace[] {
  if (places.some((place) => place.lat === undefined || place.lng === undefined)) return places;
  let best = places;
  let bestScore = Infinity;
  const visit = (route: CandidatePlace[], rest: CandidatePlace[], distance: number) => {
    if (distance >= bestScore) return;
    if (rest.length === 0) {
      const score = distance + (route[0].category === "맛집" ? MEAL_FIRST_PENALTY_KM : 0);
      if (score < bestScore) {
        best = route;
        bestScore = score;
      }
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

/**
 * 하루가 조금만 넓게 퍼졌다면 통째로 거절하지 않고, 가장 멀리 튀는 곳부터 덜어내 2곳까지 줄여 본다.
 * 그래도 가깝게 묶이지 않으면 원래 동선을 돌려줘서 호출한 쪽이 실패로 다룬다.
 */
function trimToNear(day: CandidatePlace[]): CandidatePlace[] {
  let current = shortestDayRoute(day);
  while (!routeIsNear(current) && current.length > 2) {
    const total = (route: CandidatePlace[]) => route.slice(1).reduce(
      (sum, place, i) => sum + (distanceKm(route[i], place) ?? 0), 0);
    // 하나씩 빼 보고 총 이동거리가 가장 크게 줄어드는 곳을 덜어낸다.
    const candidates = current.map((_, i) => shortestDayRoute(current.filter((__, j) => j !== i)));
    current = candidates.reduce((a, b) => (total(b) < total(a) ? b : a));
  }
  return routeIsNear(current) ? current : shortestDayRoute(day);
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

interface PetContext {
  name: string;
  breed: string;
  size: string;
  ageYears: number | null;
}

/** 프롬프트에 그대로 들어가는 값이라 길이를 자르고, 모양이 틀리면 없는 셈 친다(요청을 거절하지 않는다). */
function readPet(body: unknown): PetContext | null {
  const raw = (body as { pet?: unknown }).pet;
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;
  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
  const size = text(p.size, 10);
  if (!["소형견", "중형견", "대형견"].includes(size)) return null;
  const age = typeof p.ageYears === "number" && Number.isFinite(p.ageYears) && p.ageYears >= 0 && p.ageYears < 40 ? p.ageYears : null;
  return { name: text(p.name, 20), breed: text(p.breed, 30), size, ageYears: age };
}

/** 이전 추천에서 이미 보여준 장소. "다시 짜줘"가 같은 코스를 되풀이하지 않게 후보에서 뺀다. */
function readExcludeIds(body: unknown): Set<string> {
  const raw = (body as { excludeIds?: unknown }).excludeIds;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((id): id is string => typeof id === "string" && id.length <= 80).slice(0, 40));
}

/** 제외하고도 고를 곳이 이만큼은 남아야 제외를 적용한다 — 안 그러면 짤 수 있는 코스가 사라진다. */
const MIN_CANDIDATES_AFTER_EXCLUDE = 8;

interface ParsedSuggestion {
  label: string;
  summary?: string;
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
  const summary = typeof r.summary === "string" ? r.summary.replace(/\s+/g, " ").trim().slice(0, 240) : "";
  return { label: r.label.trim(), ...(summary ? { summary } : {}), days };
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

// 키·모델 돌려 쓰기(429·503 갈아타기, 키별 쿨다운)는 lib/gemini.ts의 generateContentWithKeys가 맡는다.

const router = Router();

// POST /api/ai/course-suggestion — 자연어 요청 + 후보 장소 목록을 받아 AI가 일차별 동선을 짜준다.
// 후보 장소는 프론트가 이미 들고 있는 실데이터를 그대로 보낸다(백엔드 places.ts는 아직 스텁이라 미신뢰).
// Gemini(무료 티어) 사용 — 발급: https://aistudio.google.com/apikey
router.post("/course-suggestion", asyncHandler(async (req, res) => {
  if (geminiApiKeys().length === 0) {
    return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았어요. backend/.env를 확인해주세요" });
  }
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: "요청 형식이 올바르지 않아요" });
  }
  const { prompt, nights, transport, candidatePlaces } = req.body;
  const pet = readPet(req.body);

  const allowed = candidatePlaces.filter((place: CandidatePlace) => isAllowedForPrompt(place, prompt));
  // 이미 보여준 장소는 뺀다 — 단, 뺀 뒤에도 충분히 남을 때만.
  const excludeIds = readExcludeIds(req.body);
  const fresh = allowed.filter((place: CandidatePlace) => !excludeIds.has(place.id));
  const usable: CandidatePlace[] = fresh.length >= MIN_CANDIDATES_AFTER_EXCLUDE ? fresh : allowed;
  const placeIds = [...new Set(usable.map((place) => place.id))];
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
      summary: {
        type: Type.STRING,
        description:
          "responseType이 course일 때만 채운다. 이 코스를 왜 이렇게 짰는지 1~2문장(시간 흐름, 이동이 짧은 이유, 반려동물을 배려한 점). 존댓말, 120자 이내.",
      },
      days: {
        type: Type.ARRAY,
        description: `responseType이 course일 때만 채운다. 정확히 ${dayCount}일치 동선. 각 원소는 candidatePlaces의 id만 사용한다. 배열 순서가 방문 순서다.`,
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

  const placesDescription = usable
    .map(
      (place) =>
        `- ${place.id}: ${place.name} (${place.district} · ${place.category} · ${place.petFriendly ? "동반가능" : "동반 여부 미확인"} · ${place.condition}${place.lat === undefined ? "" : ` · ${place.lat},${place.lng}`})`
    )
    .join("\n");

  const petLine = pet
    ? `\n함께 가는 반려견: ${pet.name ? `${pet.name}, ` : ""}${pet.breed ? `${pet.breed}, ` : ""}${pet.size}${pet.ageYears === null ? "" : `, ${pet.ageYears}살`}`
    : "";

  const systemInstruction =
    "너는 '대저니유' 앱의 AI 안내이자 반려동물 동반 여행 코스 추천 어시스턴트야. " +
    "대저니유는 대전 5개 구(유성구·중구·동구·대덕구·서구)의 반려동물 동반 여행지를 소개하고 " +
    "코스로 묶어주는 앱이고, 코스는 내 여정 탭에서 MBTI 추천·AI 추천(지금 이 대화)·직접 짓기 중 하나로 만든다. " +
    "사용자의 메시지가 서비스 설명, 인사, 잡담처럼 장소·코스 추천과 무관하면 " +
    "반드시 responseType을 chat으로 하고 message에 짧고 친근하게 답해 — 이때는 절대 코스를 지어내지 마. " +
    "사용자가 실제로 갈 곳이나 코스를 원할 때만 responseType을 course로 하고, " +
    "아래 후보 장소 목록에 있는 id만 사용해서 하루 3~4곳(최소 2, 최대 5)씩 동선을 짜. " +
    "목록에 없는 장소를 지어내면 안 돼. 여러 날에 같은 장소를 반복하지 마. " +
    "하루 이동은 직선거리 합계 16km 이내, 한 구간은 10km 이내로 묶어 — 좌표가 있으니 가까운 곳끼리 골라. " +
    "사용자가 구를 말하지 않았다면 후보 중 서로 가까이 모여 있는 한 구역을 정해 그 안에서 짜고, " +
    "여러 날이면 날마다 구역을 바꿔도 되지만 하루 안에서는 한 구역에 머물러. " +
    "하루 흐름은 오전 야외 활동(산책·놀이터) → 점심 식사(맛집) → 오후 카페·문화·놀이 → 가벼운 마무리 순으로 하고, " +
    "식사 장소로 하루를 시작하지 마. 매일 식사할 곳(맛집)을 하나 이상 넣어. " +
    "산책·놀이터·맛집·문화를 가능한 범위에서 섞어서 하루가 단조롭지 않게 해. " +
    "사용자가 명시적으로 한 종류의 장소만 요청한 경우에는 그 요청을 우선해. " +
    "반려견 정보가 주어지면 반영해: 소형견은 오래 걷는 코스를 줄이고 소형견 가능 조건이 있는 곳을 적극 살리고, " +
    "대형견이나 중형견은 조건에 '소형견'만 허용한다고 적힌 곳을 고르지 마. 노령견(8살 이상)은 하루 3곳 안쪽으로 여유 있게 짜. " +
    "각 장소의 '조건'(목줄·크기 제한·실내외 등)을 읽고 반려견에게 맞지 않는 곳은 피해. " +
    "빵지순례 요청이면 bakery- id인 빵집 2~3곳을 가까운 산책 장소와 함께 고르고, 빵집의 반려동물 동반 여부는 반드시 확인 필요하다고 안내해. " +
    "summary에는 왜 이렇게 짰는지를 근거(이동이 짧다, 오전 산책 뒤 점심 등)와 함께 1~2문장으로 써. " +
    "사용자의 취향과 방문 조건을 먼저 지켜줘.";

  /** 검증을 통과한 코스 또는 왜 안 됐는지(다음 시도에 알려줄 말 포함). */
  type Rejection = { ok: false; status: number; error: string; feedback: string };
  type Evaluation = { ok: true; suggestion: ParsedSuggestion; days: CandidatePlace[][] } | Rejection;

  const byId = new Map<string, CandidatePlace>(candidatePlaces.map((place: CandidatePlace) => [place.id, place]));
  const evaluate = (suggestion: ParsedSuggestion): Evaluation => {
    // 하루가 넓게 퍼졌으면 튀는 곳을 덜어내 가까운 동선으로 고친다.
    const days = suggestion.days.map((day) => trimToNear(day.map((placeId) => byId.get(placeId)!)));
    if (days.some((day) => !routeIsNear(day))) {
      return {
        ok: false, status: 502,
        error: "가까운 장소로 코스를 만들지 못했어요. 지역이나 조건을 바꿔 다시 시도해주세요",
        feedback: "이전 답은 하루 안에서 장소끼리 너무 멀었어. 좌표가 가까운 곳끼리만 골라서 다시 짜.",
      };
    }
    const keptIds = days.map((day) => day.map((place) => place.id));
    if (!matchesCourseIntent(keptIds, byId, prompt)) {
      return {
        ok: false, status: 502,
        error: "요청한 테마에 맞는 코스를 만들지 못했어요. 다시 시도해주세요",
        feedback: /빵지순례|빵집|베이커리|제과점/.test(prompt)
          ? "이전 답은 빵지순례 조건(서로 다른 빵집 2곳 이상 + 가까운 산책 장소)을 못 맞췄어. 다시 짜."
          : "이전 답은 어느 날에 식사할 곳(맛집)이 빠졌어. 매일 맛집을 하나 이상 넣어서 다시 짜.",
      };
    }
    return { ok: true, suggestion, days };
  };

  try {
    /* 스키마로 모양을 묶어놔도 모델이 가끔 샌다 — responseType은 course라고 해놓고 days 대신
       message에 인사말만 채워 보내는 식이다. 걸러낸 결과가 비거나 동선·테마 검증에 걸리면
       오류를 보이기 전에 이유를 알려주고 한 번 더 짜게 한다. */
    const MAX_ATTEMPTS = 2;
    let outcome: Evaluation | null = null;
    let chat: string | null = null;
    let feedback = "";
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const response = await generateContentWithKeys({
        contents: `요청: ${prompt}\n\n이동수단: ${transport}\n일수: ${dayCount}일${petLine}\n\n후보 장소 목록:\n${placesDescription}${feedback ? `\n\n[재시도] ${feedback}` : ""}`,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema },
      });

      const text = response.text;
      const parsed = text ? sanitizeResponse(parseJsonOrNull(text), validIds, dayCount) : null;
      if (parsed === null) {
        outcome = null;
        feedback = "이전 답은 형식이 맞지 않았어. 스키마에 맞춰 다시 답해.";
        continue;
      }
      if (parsed.responseType === "chat") {
        chat = parsed.message;
        break;
      }
      outcome = evaluate(parsed.suggestion);
      if (outcome.ok) break;
      feedback = outcome.feedback;
    }

    if (chat !== null) return res.json({ responseType: "chat" as const, message: chat });
    if (!outcome) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }
    if (!outcome.ok) return res.status(outcome.status).json({ error: outcome.error });

    const days = outcome.days.map((day) =>
      day.map((place) => ({
        placeId: place.id,
        name: place.name,
        category: place.category,
        district: place.district,
        condition: place.condition,
        petFriendly: place.petFriendly,
      }))
    );

    res.json({
      responseType: "course" as const,
      label: outcome.suggestion.label,
      ...(outcome.suggestion.summary ? { summary: outcome.suggestion.summary } : {}),
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
    // ApiError가 아닌 오류(네트워크 끊김·깨진 키 등)를 그대로 던지면 async 핸들러의 미처리 거부가 되어 서버 프로세스가
    // 죽는다 - 요청 하나의 실패로 끝내고 502로 알린다.
    console.error("AI 코스 추천 처리 중 예상치 못한 오류:", error);
    return res.status(502).json({ error: "AI 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요" });
  }
}));

export default router;
