import type { CourseSource, CourseStop, Place, PlaceCategory } from "@/types";

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

/** 카카오 검색으로 담긴 장소는 이 값이 있으면 카카오맵 원본 페이지로 보낼 수 있다(id처럼 항상 있진 않음). */
export function resolvePlaceUrl(place: { id: string; placeUrl?: string | null }): string | null {
  return place.placeUrl ?? null;
}

/**
 * condition 문구가 "방문 전 확인해주세요" 류의 비확정 안내인지 판별한다(카카오 검색, 대전시
 * 공공데이터·공원 등 tier 2 소스가 여기 해당 — 이름만 봐서는 카카오인지 공공데이터인지 구분이
 * 안 되므로 문구 자체로 판단한다). 이런 소스는 확정형 "🐾 동반 가능" 배지와 같이 두면
 * "확인해주세요"라면서 동시에 "확인됨"이라고 말하는 모순이 생긴다 — 이 경우 안내문 하나만 보여줘야
 * 하고, 식약처·문체부처럼 실제로 확정된 조건(예: "전 견종 동반 가능")을 주는 tier 1 소스는 배지와
 * 조건 문구를 같이 보여줘도 모순이 없다.
 */
export function isUnverifiedCondition(condition: string): boolean {
  return condition.includes("확인해주세요");
}

/** 표준화된 안내 태그 — isUnverifiedCondition이 true인 condition의 뒷부분(안내문)은
 * 소스마다 문구가 조금씩 달라("방문 전 확인해주세요"/"현장에서 확인해주세요") 굳이 원문을
 * 그대로 보여줄 필요 없이 짧고 통일된 문구 하나로 대신한다. */
export const NEEDS_CHECK_LABEL = "🔍 동반 가능 여부 확인 필요";

/** condition 문구의 앞부분(출처)만 뽑는다 — "카카오맵 검색 결과 · 반려동물 동반 가능 여부는
 * 방문 전 확인해주세요"처럼 항상 "{출처} · {안내문}" 형태라, 태그 두 개로 쪼갤 때 짧은 출처
 * 태그로 쓴다. " · "가 없는 문구(식약처·문체부처럼 안내문 없이 조건만 있는 경우)는 원문 그대로. */
export function conditionSourceLabel(condition: string): string {
  return condition.split(" · ")[0];
}

/** 위저드/코스 상세에서 고른 Place를 저장용 CourseStop 스냅샷으로 변환한다 —
 * 세 화면(직접짓기, MBTI, 코스 상세의 "장소 추가")에서 거의 동일한 매핑을 각자 두면 필드 하나가
 * 빠졌을 때 화면마다 다르게 동작하는 버그가 생기기 쉬워 여기 한 곳으로 모은다. */
export function placeToStop(place: Place): CourseStop {
  return {
    placeId: place.id,
    name: place.name,
    category: place.category,
    district: place.district,
    condition: place.condition,
    petFriendly: place.petFriendly,
    imageUrl: resolvePlaceImageUrl(place),
    placeUrl: resolvePlaceUrl(place),
  };
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
