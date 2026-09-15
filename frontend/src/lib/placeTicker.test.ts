import { describe, expect, it } from "vitest";
import { toTickerPlace } from "@/lib/placeTicker";
import { makePlace } from "@/test/fixtures";

describe("toTickerPlace", () => {
  it("티커에 필요한 필드만 남긴다 — 좌표는 장소별 날씨 조회용으로 함께 넘긴다", () => {
    const place = makePlace({ id: "p1", name: "한밭수목원", category: "산책", lat: 36.36, lng: 127.38 });

    expect(toTickerPlace(place)).toEqual({
      id: "p1",
      name: "한밭수목원",
      category: "산책",
      lat: 36.36,
      lng: 127.38,
    });
  });
});
