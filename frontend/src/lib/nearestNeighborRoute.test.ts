import { describe, expect, it } from "vitest";
import { nearestNeighborRoute, routeDistanceKm, shortestRoute } from "@/lib/nearestNeighborRoute";

/** 대전 시내 좌표 몇 곳 — 서→동으로 갈수록 lng이 커진다. */
const 서구 = { id: "서구", lat: 36.351, lng: 127.384 };
const 유성구 = { id: "유성구", lat: 36.362, lng: 127.356 };
const 중구 = { id: "중구", lat: 36.325, lng: 127.421 };
const 동구 = { id: "동구", lat: 36.311, lng: 127.454 };

describe("nearestNeighborRoute", () => {
  it("빈 목록·한 곳은 그대로 돌려준다", () => {
    expect(nearestNeighborRoute([])).toEqual([]);
    expect(nearestNeighborRoute([서구])).toEqual([서구]);
  });

  it("원본 배열을 건드리지 않는다", () => {
    const places = [서구, 동구, 유성구];

    nearestNeighborRoute(places);

    expect(places).toEqual([서구, 동구, 유성구]);
  });

  it("들어온 장소를 하나도 빠뜨리거나 더하지 않는다", () => {
    const route = nearestNeighborRoute([서구, 동구, 유성구, 중구]);

    expect(route).toHaveLength(4);
    expect(new Set(route.map((p) => p.id)).size).toBe(4);
  });

  it("가까운 곳부터 이어붙인다", () => {
    // 서구에서 출발하면 유성구(가까움) → 중구 → 동구 순이 자연스럽다.
    const route = nearestNeighborRoute([서구, 동구, 중구, 유성구]);

    expect(route.map((p) => p.id)).toEqual(["서구", "유성구", "중구", "동구"]);
  });

  it("시작점을 지정하면 거기서 출발한다", () => {
    const route = nearestNeighborRoute([서구, 동구, 중구, 유성구], 1);

    expect(route[0].id).toBe("동구");
  });

  it("시작점이 범위를 벗어나도 터지지 않는다", () => {
    expect(nearestNeighborRoute([서구, 유성구], 99)[0].id).toBe("유성구");
    expect(nearestNeighborRoute([서구, 유성구], -5)[0].id).toBe("서구");
  });
});

describe("routeDistanceKm", () => {
  it("한 곳 이하면 이동 거리가 0", () => {
    expect(routeDistanceKm([])).toBe(0);
    expect(routeDistanceKm([서구])).toBe(0);
  });

  it("구간 거리를 모두 더한다", () => {
    const total = routeDistanceKm([서구, 유성구, 중구]);
    const leg1 = routeDistanceKm([서구, 유성구]);
    const leg2 = routeDistanceKm([유성구, 중구]);

    expect(total).toBeCloseTo(leg1 + leg2, 6);
  });

  it("최근접 경로가 원래 순서보다 짧거나 같다", () => {
    const naive = [서구, 동구, 유성구, 중구];

    expect(routeDistanceKm(nearestNeighborRoute(naive))).toBeLessThanOrEqual(
      routeDistanceKm(naive)
    );
  });

  it("방향이 바뀌어도 같은 거리다", () => {
    const forward = routeDistanceKm([서구, 유성구, 중구]);
    const backward = routeDistanceKm([중구, 유성구, 서구]);

    expect(forward).toBeCloseTo(backward, 6);
  });
});

describe("shortestRoute", () => {
  it("시작점까지 바꿔 가장 짧은 방문 순서를 고른다", () => {
    const places = [동구, 서구, 유성구, 중구];
    const route = shortestRoute(places);
    expect(routeDistanceKm(route)).toBeLessThanOrEqual(routeDistanceKm(nearestNeighborRoute(places)));
    expect(new Set(route.map((place) => place.id)).size).toBe(4);
  });
});
