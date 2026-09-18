import { haversine } from "./haversine";

interface LatLng {
  lat: number;
  lng: number;
}

/** 지정한 시작점부터 가장 가까운 지점을 그리디하게 이어붙인 방문 순서를 반환한다. */
export function nearestNeighborRoute<T extends LatLng>(places: T[], startIndex = 0): T[] {
  if (places.length < 2) return [...places];
  const rest = [...places];
  const [start] = rest.splice(Math.max(0, Math.min(startIndex, rest.length - 1)), 1);
  const route = [start];
  while (rest.length) {
    let bestIndex = 0;
    let bestDist = Infinity;
    rest.forEach((place, index) => {
      const dist = haversine(route[route.length - 1], place);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = index;
      }
    });
    route.push(rest.splice(bestIndex, 1)[0]);
  }
  return route;
}

/** 추천 코스처럼 장소가 적을 때는 모든 시작점과 방문 순서를 비교해 가장 짧은 경로를 고른다. */
export function shortestRoute<T extends LatLng>(places: T[]): T[] {
  if (places.length < 2) return [...places];
  if (places.length > 8) return nearestNeighborRoute(places);

  let best = [...places];
  let bestDistance = Infinity;
  const visit = (route: T[], remaining: T[], distance: number) => {
    if (distance >= bestDistance) return;
    if (remaining.length === 0) {
      best = route;
      bestDistance = distance;
      return;
    }
    remaining.forEach((place, index) => {
      const leg = route.length > 0 ? haversine(route[route.length - 1], place) : 0;
      visit([...route, place], [...remaining.slice(0, index), ...remaining.slice(index + 1)], distance + leg);
    });
  };
  visit([], places, 0);
  return best;
}

/** 경로 전체 이동 거리(km) 합산 */
export function routeDistanceKm(route: LatLng[]): number {
  let sum = 0;
  for (let i = 1; i < route.length; i++) {
    sum += haversine(route[i - 1], route[i]);
  }
  return sum;
}
