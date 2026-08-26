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

/** 카테고리별 배경/글자 색 — 동선 리스트 썸네일이 전부 민트 한 톤이라 단조로워서 카테고리마다 다르게 준다. */
export const CATEGORY_TONE: Record<PlaceCategory, { bg: string; text: string }> = {
  산책: { bg: "bg-brand-100", text: "text-brand-700" },
  놀이터: { bg: "bg-accent-coral-light", text: "text-accent-coral" },
  맛집: { bg: "bg-accent-amber-light", text: "text-accent-amber" },
  문화: { bg: "bg-accent-purple-light", text: "text-accent-purple" },
};

/** Place 계열 타입 중 imageUrl을 들고 있는 소스(PickablePlace 등)에서만 안전하게 꺼낸다.
 * Place 자체엔 이 필드가 없어(Player1 소유 타입) 없으면 null로 취급한다.
 * (매개변수에 id를 같이 요구하는 건 Place와 공통 필드가 하나도 없으면 TS가 "약한 타입" 경고를
 * 내기 때문 — id는 Place에 항상 있으니 걸리지 않으면서 구조적으로 안전하게 받는다.) */
export function resolvePlaceImageUrl(place: { id: string; imageUrl?: string | null }): string | null {
  return place.imageUrl ?? null;
}

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
