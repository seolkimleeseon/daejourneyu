import type { FestivalEvent, Place, Review } from "@/types";

export interface MonthlyBriefing {
  monthFestivals: FestivalEvent[];
  topPlaces: Place[];
  walkPick: Place | null;
}

function reviewCount(placeId: string, reviews: Review[]): number {
  return reviews.filter((review) => review.placeId === placeId).length;
}

/** 홈 탭 "월간 브리핑" 카드용 데이터 — 이번 달 축제 · 후기 수 기준 인기 장소 TOP3 · 추천 산책로. */
export function computeMonthlyBriefing(
  places: Place[],
  reviews: Review[],
  festivals: FestivalEvent[],
  monthYm: string
): MonthlyBriefing {
  const monthFestivals = festivals.filter((festival) => festival.date.slice(0, 7) === monthYm);

  const petFriendlyPlaces = places.filter((place) => place.petFriendly);
  const topPlaces = [...petFriendlyPlaces]
    .sort((a, b) => reviewCount(b.id, reviews) - reviewCount(a.id, reviews))
    .slice(0, 3);

  const walkPick =
    [...petFriendlyPlaces]
      .filter((place) => place.category === "산책")
      .sort((a, b) => reviewCount(b.id, reviews) - reviewCount(a.id, reviews))[0] ?? null;

  return { monthFestivals, topPlaces, walkPick };
}
