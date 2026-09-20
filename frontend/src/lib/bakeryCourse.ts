import type { Place } from "@/types";
import { haversine } from "./haversine";
import { routeDistanceKm, shortestRoute } from "./nearestNeighborRoute";

const MAX_LEG_KM = 5;
const MAX_ROUTE_KM = 12;
const EXCLUDED_CHAINS = ["파리바게", "뚜레쥬르", "던킨", "크리스피크림", "브레댄코", "파리크라상", "로띠번", "호밀호두"];
// 대전시 시민추천 빵집(상위)과 대전시 빵지순례 소개 업소.
// https://daejeon.go.kr/fod/ContentsHtmlView.do?menuSeq=7834
// https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=3318&menuSeq=5942&pageIndex=1
const CITIZEN_FAVORITES = ["성심당", "빵한모금", "연이가베이크샵", "하레하레", "다소리과자점"];
const CITY_FEATURED = ["정동문화사", "카페지니", "수제빵연구소", "콜드버터베이크샵", "대전사라다", "몽심", "명기네빵집"];
const MULTI_BRANCH_BRANDS = ["성심당", "몽심", "하레하레", "수제빵연구소", "대전사라다", "정인구팥빵"];

function bakeryHighlightScore(name: string): number {
  const key = bakeryBrandKey(name);
  if (CITIZEN_FAVORITES.some((featured) => key.includes(featured))) return 2;
  if (CITY_FEATURED.some((featured) => key.includes(featured))) return 1;
  return 0;
}

/** 중복 인허가(상호 끝 숫자)와 같은 브랜드의 지점을 한 코스에서 구분한다. */
function bakeryBrandKey(name: string): string {
  const normalized = name.replace(/[\s()·._-]/g, "").toLowerCase()
    .replace(/^(?:주식회사|주)/, "")
    .replace(/(?:점)?[1-9](?:호점)?$/, "")
    .replace(/(?:대전[가-힣0-9]*점|본점)$/, "");
  return MULTI_BRANCH_BRANDS.find((brand) => normalized.startsWith(brand)) ?? normalized;
}

/** 빵집 두 곳과 반려동물 동반 산책 장소를 가까운 동선으로 묶는다. */
export function recommendBakeryRoute(bakeries: Place[], otherPlaces: Place[], variation = 0): Place[] {
  const eligibleBakeries = bakeries.filter((place) => !EXCLUDED_CHAINS.some((chain) => bakeryBrandKey(place.name).includes(chain)));
  const walks = otherPlaces.filter((place) => place.petFriendly &&
    (place.category === "산책" || place.category === "놀이터"));
  const brandKeys = eligibleBakeries.map((place) => bakeryBrandKey(place.name));
  const nearbyWalks = eligibleBakeries.map((bakery) => {
    const nearby = new Map<Place, number>();
    for (const walk of walks) {
      const distance = haversine(bakery, walk);
      if (distance <= MAX_LEG_KM) nearby.set(walk, distance);
    }
    return nearby;
  });
  const routes: { places: Place[]; distance: number; highlight: number; pair: string }[] = [];

  for (let i = 0; i < eligibleBakeries.length; i++) {
    for (let j = i + 1; j < eligibleBakeries.length; j++) {
      const first = eligibleBakeries[i];
      const second = eligibleBakeries[j];
      if (brandKeys[i] === brandKeys[j]) continue;
      if (haversine(first, second) > MAX_LEG_KM) continue;
      const commonWalks = [...nearbyWalks[i]].flatMap(([walk, firstDistance]) => {
        const secondDistance = nearbyWalks[j].get(walk);
        return secondDistance === undefined ? [] : [{ walk, distance: firstDistance + secondDistance }];
      }).sort((a, b) => a.distance - b.distance);
      for (const { walk } of commonWalks.slice(0, 2)) {
        const route = shortestRoute([first, second, walk]);
        const distance = routeDistanceKm(route);
        if (distance > MAX_ROUTE_KM || route.some((stop, index) =>
          index > 0 && haversine(route[index - 1], stop) > MAX_LEG_KM
        )) continue;
        routes.push({ places: route, distance, highlight: bakeryHighlightScore(first.name) + bakeryHighlightScore(second.name), pair: [first.id, second.id].sort().join(":") });
      }
    }
  }

  routes.sort((a, b) => b.highlight - a.highlight || a.distance - b.distance);
  const seenPairs = new Set<string>();
  const varied = routes.filter((route) => {
    if (seenPairs.has(route.pair)) return false;
    seenPairs.add(route.pair);
    return true;
  }).slice(0, 12);
  return varied.length ? varied[variation % varied.length].places : [];
}
