import type { Place, PlaceCategory } from "@/types";

/** Place + 표시용 사진 URL·소스 신뢰도. src/types/place.ts(Player1 소유)는 건드리지 않고 이 파일에서만 확장해 쓴다.
 * sourceTier는 backend(/api/places, backend/scripts/syncPlaces.ts)가 매긴 신뢰도(1=동반 인증 소스,
 * 2=공공데이터 미인증)이고, 카카오맵 실시간 검색 결과처럼 백엔드 Place 테이블 밖에서 온 항목은 없다
 * (PlacePickerSheet가 id 접두사 "kakao-"로 판별해 별도 처리한다). */
export interface PickablePlace extends Place {
  imageUrl: string | null;
  sourceTier?: number;
}

const ALL_CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화"];

/**
 * 대전 지역은 실데이터만으론 카테고리별로 아주 적을 수 있다(예: 관광지 몇 곳뿐이고 문화시설·음식점은
 * 0곳인 경우도 있음). 그래서 카테고리마다 최소 개수를 보장하려면 실데이터만으론 부족해서,
 * 부족한 카테고리는 mockPlaces(폴백 풀)에서 이름이 겹치지 않는 것부터 채워 넣는다.
 * MBTI 코스 생성(app/(shell)/schedule/course/new/mbti)에서 사용.
 */
export function ensureCategoryMinimum(
  primary: PickablePlace[],
  fallbackPool: Place[],
  minPerCategory = 3
): (PickablePlace | Place)[] {
  const result: (PickablePlace | Place)[] = [...primary];
  const usedNames = new Set(primary.map((place) => place.name));

  for (const category of ALL_CATEGORIES) {
    const have = primary.filter((place) => place.category === category).length;
    if (have >= minPerCategory) continue;
    const need = minPerCategory - have;
    const supplements = fallbackPool.filter((place) => place.category === category && !usedNames.has(place.name)).slice(0, need);
    supplements.forEach((place) => usedNames.add(place.name));
    result.push(...supplements);
  }

  return result;
}
