import type { CourseSource, PlaceCategory } from "@/types";

/** 0 = 당일치기, n = n박 (n+1)일 */
export function nightsLabel(nights: number): string {
  return nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;
}

/** 장소 카테고리별 대표 이모지 — 동선 리스트의 원형 아바타 등에서 공용으로 쓴다. */
export const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  산책: "🌳",
  놀이터: "🎾",
  맛집: "🍖",
  문화: "🎨",
};

export const SOURCE_LABEL: Record<CourseSource, string> = {
  ai: "AI 추천",
  manual: "직접 지음",
  saved: "내가 담은 코스",
};

export const SOURCE_TONE: Record<CourseSource, "purple" | "brand" | "coral"> = {
  ai: "purple",
  manual: "brand",
  saved: "coral",
};

/** 코스가 어떻게 만들어졌는지에 따른 티켓 기본 이모지 — 사용자가 직접 고르지 않았을 때의 대표 이모지. */
export const SOURCE_EMOJI: Record<CourseSource, string> = {
  ai: "✨",
  manual: "📍",
  saved: "🔖",
};

/** 여권 카드(PetPassportCard)와 같은 축의 티켓 밴드 색 — 상/하단 띠 배경. */
export const SOURCE_BAND_BG: Record<CourseSource, string> = {
  ai: "bg-accent-purple-light",
  manual: "bg-brand-100",
  saved: "bg-accent-coral-light",
};

export const SOURCE_BAND_BORDER: Record<CourseSource, string> = {
  ai: "border-accent-purple/25",
  manual: "border-brand-300",
  saved: "border-accent-coral/25",
};

export const SOURCE_TEXT: Record<CourseSource, string> = {
  ai: "text-accent-purple",
  manual: "text-brand-700",
  saved: "text-accent-coral",
};

export function resolveCourseEmoji(emoji: string | null | undefined, source: CourseSource): string {
  return emoji || SOURCE_EMOJI[source];
}
