import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKakaoPlacesMulti, type KakaoSearchTarget } from "@/hooks/useKakaoPlaces";
import type { ApiKakaoPlace } from "@/lib/kakaoPlaceMapper";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

const fetchMock = vi.fn();

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

function kakaoPlace(overrides: Partial<ApiKakaoPlace> = {}): ApiKakaoPlace {
  return {
    id: "kakao-1",
    name: "댕댕카페",
    categoryName: "음식점 > 카페",
    address: "대전 서구 둔산대로 169",
    lat: 36.36,
    lng: 127.38,
    phone: null,
    placeUrl: "http://place.map.kakao.com/1",
    imageUrl: null,
    ...overrides,
  };
}

function placesResponse(places: ApiKakaoPlace[]) {
  return new Response(JSON.stringify({ places }), {
    headers: { "Content-Type": "application/json" },
  });
}

const targets: KakaoSearchTarget[] = [
  { category: "맛집", query: "대전 서구 애견동반 식당" },
  { category: "산책", query: "대전 서구 공원" },
];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useKakaoPlacesMulti", () => {
  it("검색어마다 병렬로 요청해 결과를 합친다", async () => {
    fetchMock
      .mockResolvedValueOnce(placesResponse([kakaoPlace({ id: "k1" })]))
      .mockResolvedValueOnce(placesResponse([kakaoPlace({ id: "k2", name: "한밭수목원" })]));

    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.places.map((place) => place.id)).toEqual(["k1", "k2"]);
  });

  it("같은 업체가 여러 검색어에 걸려도 한 번만 남긴다", async () => {
    // "공원"과 "관광명소"처럼 검색어가 겹치면 같은 id가 두 번 들어온다.
    fetchMock
      .mockResolvedValueOnce(placesResponse([kakaoPlace({ id: "k1" })]))
      .mockResolvedValueOnce(placesResponse([kakaoPlace({ id: "k1" })]));

    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places).toHaveLength(1);
  });

  it("먼저 매칭된 카테고리를 우선한다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        placesResponse([kakaoPlace({ id: "k1", categoryName: "서비스 > 기타" })])
      )
      .mockResolvedValueOnce(
        placesResponse([kakaoPlace({ id: "k1", categoryName: "서비스 > 기타" })])
      );

    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 카테고리를 못 알아내면 검색 대상의 카테고리를 폴백으로 쓴다 — 앞선 검색(맛집)이 남는다.
    expect(result.current.places[0].category).toBe("맛집");
  });

  it("대전 밖·좌표 이상 항목은 걸러진 채로 온다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        placesResponse([
          kakaoPlace({ id: "k1" }),
          kakaoPlace({ id: "k2", address: "세종 한누리대로 2130" }),
          kakaoPlace({ id: "k3", lat: Number.NaN }),
        ])
      )
      .mockResolvedValueOnce(placesResponse([]));

    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.places.map((place) => place.id)).toEqual(["k1"]);
  });

  it("enabled=false면 아무 요청도 안 보낸다", () => {
    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.places).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("검색어가 비어 있으면 그 건은 건너뛴다", async () => {
    fetchMock.mockResolvedValue(placesResponse([kakaoPlace({ id: "k1" })]));

    const { result } = renderWithClient(() =>
      useKakaoPlacesMulti([{ category: "맛집", query: "   " }, targets[1]], true)
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("대상이 없으면 빈 목록", () => {
    const { result } = renderWithClient(() => useKakaoPlacesMulti([], true));

    expect(result.current.places).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("한쪽 검색이 실패해도 나머지 결과는 보여준다", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 500 }))
      .mockResolvedValueOnce(placesResponse([kakaoPlace({ id: "k2" })]));

    const { result } = renderWithClient(() => useKakaoPlacesMulti(targets, true));
    await waitFor(() => expect(result.current.places).toHaveLength(1), { timeout: 3000 });

    expect(result.current.places[0].id).toBe("k2");
  });
});
