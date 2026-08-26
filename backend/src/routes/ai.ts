import { Router } from "express";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../lib/anthropic";

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

const router = Router();

// POST /api/ai/course-suggestion — 자연어 요청 + 후보 장소 목록을 받아 AI가 일차별 동선을 짜준다.
// 후보 장소는 프론트가 이미 들고 있는 실데이터를 그대로 보낸다(백엔드 places.ts는 아직 스텁이라 미신뢰).
router.post("/course-suggestion", async (req, res) => {
  // 키가 아예 없으면 SDK가 헤더 구성 단계에서 동기적으로 throw해 프로세스를 죽일 수 있다 —
  // 호출 전에 먼저 걸러서 안전하게 500으로 응답한다.
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY가 설정되지 않았어요. backend/.env를 확인해주세요" });
  }
  if (!validateRequest(req.body)) {
    return res.status(400).json({ error: "요청 형식이 올바르지 않아요" });
  }
  const { prompt, nights, transport, candidatePlaces } = req.body;

  // z.enum은 빈 배열을 허용하지 않는다 — candidatePlaces.length > 0은 validateRequest에서 이미 보장됨.
  const placeIds = candidatePlaces.map((place) => place.id) as [string, ...string[]];
  const dayCount = nights + 1;

  const suggestionSchema = z.object({
    label: z.string().describe("코스 이름. 15자 이내, 반려동물과 어울리는 감성으로."),
    days: z
      .array(z.array(z.enum(placeIds)).min(2).max(5))
      .length(dayCount)
      .describe(`정확히 ${dayCount}일치 동선. 각 원소는 candidatePlaces의 id만 사용한다.`),
  });

  const placesDescription = candidatePlaces
    .map(
      (place) =>
        `- ${place.id}: ${place.name} (${place.district} · ${place.category} · ${place.petFriendly ? "동반가능" : "동반불가"} · ${place.condition})`
    )
    .join("\n");

  try {
    const response = await anthropic.messages.parse({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system:
        "너는 대전 지역 반려동물 동반 여행 코스를 짜주는 어시스턴트야. " +
        "반드시 아래 후보 장소 목록에 있는 id만 사용해서 하루 2~5곳씩 동선을 짜. " +
        "목록에 없는 장소를 지어내면 안 돼. 같은 날엔 가까운 지역끼리 묶어서 동선이 자연스럽게 해줘.",
      messages: [
        {
          role: "user",
          content: `요청: ${prompt}\n\n이동수단: ${transport}\n일수: ${dayCount}일\n\n후보 장소 목록:\n${placesDescription}`,
        },
      ],
      output_config: { format: zodOutputFormat(suggestionSchema) },
    });

    if (!response.parsed_output) {
      return res.status(502).json({ error: "AI 응답을 이해하지 못했어요. 다시 시도해주세요" });
    }

    const byId = new Map(candidatePlaces.map((place) => [place.id, place]));
    const days = response.parsed_output.days.map((day) =>
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
      label: response.parsed_output.label,
      nights,
      transport,
      source: "ai" as const,
      shared: false,
      days,
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY가 설정되지 않았어요. backend/.env를 확인해주세요" });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "요청이 많아요. 잠시 후 다시 시도해주세요" });
    }
    if (error instanceof Anthropic.BadRequestError) {
      // 크레딧 부족 등 계정/요청 설정 문제 — Console 확인을 안내한다(원본 API 응답은 로그로만 남긴다).
      console.error("AI 코스 추천 요청 오류:", error.message);
      return res.status(402).json({ error: "AI 서비스를 사용할 수 없어요. Anthropic 콘솔에서 크레딧·설정을 확인해주세요" });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("AI 코스 추천 API 오류:", error.message);
      return res.status(502).json({ error: "AI 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요" });
    }
    throw error;
  }
});

export default router;
