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
};

function isValidCandidatePlace(p: unknown): p is CandidatePlace {
  return (
    typeof p === "object" &&
    p !== null &&
    typeof (p as CandidatePlace).id === "string" &&
    typeof (p as CandidatePlace).name === "string" &&
    typeof (p as CandidatePlace).category === "string" &&
    typeof (p as CandidatePlace).district === "string" &&
    typeof (p as CandidatePlace).condition === "string" &&
    typeof (p as CandidatePlace).petFriendly === "boolean"
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
  if (typeof b.nights !== "number" || b.nights < 0) return false;
  if (!TRANSPORTS.includes(b.transport as Transport)) return false;
  if (!Array.isArray(b.candidatePlaces) || b.candidatePlaces.length === 0) return false;
  return b.candidatePlaces.every(isValidCandidatePlace);
}

interface ParsedSuggestion {
  label: string;
  days: string[][];
}

/** AI가 목록에 없는 id를 지어내거나 개수를 안 지키는 경우에 대비해, 응답을 그대로 믿지 않고 걸러낸다. */
function sanitizeSuggestion(raw: unknown, validIds: Set<string>, dayCount: number): ParsedSuggestion | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.label !== "string" || !Array.isArray(r.days)) return null;

  const days = r.days
    .filter((day): day is unknown[] => Array.isArray(day))
    .map((day) => day.filter((id): id is string => typeof id === "string" && validIds.has(id)))
    .filter((day) => day.length >= 2)
    .slice(0, dayCount);

  if (days.length === 0) return null;
  return { label: r.label, days };
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

  const placeIds = candidatePlaces.map((place) => place.id);
  const validIds = new Set(placeIds);
  const dayCount = nights + 1;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING, description: "코스 이름. 15자 이내, 반려동물과 어울리는 감성으로." },
      days: {
        type: Type.ARRAY,
        description: `정확히 ${dayCount}일치 동선. 각 원소는 candidatePlaces의 id만 사용한다.`,
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
    required: ["label", "days"],
  };

  const placesDescription = candidatePlaces
    .map(
      (place) =>
        `- ${place.id}: ${place.name} (${place.district} · ${place.category} · ${place.petFriendly ? "동반가능" : "동반불가"} · ${place.condition})`
    )
    .join("\n");

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `요청: ${prompt}\n\n이동수단: ${transport}\n일수: ${dayCount}일\n\n후보 장소 목록:\n${placesDescription}`,
      config: {
        systemInstruction:
          "너는 대전 지역 반려동물 동반 여행 코스를 짜주는 어시스턴트야. " +
          "반드시 아래 후보 장소 목록에 있는 id만 사용해서 하루 2~5곳씩 동선을 짜. " +
          "목록에 없는 장소를 지어내면 안 돼. 같은 날엔 가까운 지역끼리 묶어서 동선이 자연스럽게 해줘.",
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    const suggestion = sanitizeSuggestion(JSON.parse(text), validIds, dayCount);
    if (!suggestion) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    const byId = new Map(candidatePlaces.map((place) => [place.id, place]));
    const days = suggestion.days.map((day) =>
      day.map((placeId) => {
        const place = byId.get(placeId)!;
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
      label: suggestion.label,
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
