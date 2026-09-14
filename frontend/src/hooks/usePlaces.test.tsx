import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlaces } from "@/hooks/usePlaces";
import { mockPlaces } from "@/mocks";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";
import { makePlace } from "@/test/fixtures";

const fetchMock = vi.fn();

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 폴백 검증용 — 목데이터에 실제로 들어 있는 조합을 골라 쓴다. */
const mockDistrict = mockPlaces[0].district;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("usePlaces", () => {
  it("서버 목록을 그대로 준다", async () => {
    const places = [makePlace({ id: "p1" })];
    fetchMock.mockResolvedValue(jsonResponse(places));

    const { result } = renderWithClient(() => usePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(places);
  });

  it("조건이 없으면 쿼리스트링 없이 부른다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const { result } = renderWithClient(() => usePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/api/places");
  });

  it("자치구·카테고리·출처를 쿼리스트링으로 넘긴다 — 거르기는 서버 몫이다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const { result } = renderWithClient(() =>
      usePlaces({ district: "서구", category: "맛집", source: "petacp" })
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const url = new URL(fetchMock.mock.calls[0][0], "http://localhost");
    expect(url.searchParams.get("district")).toBe("서구");
    expect(url.searchParams.get("category")).toBe("맛집");
    expect(url.searchParams.get("source")).toBe("petacp");
  });

  it("null 조건은 빼고 보낸다 — '전체' 칩이 null을 넘긴다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const { result } = renderWithClient(() => usePlaces({ district: null, category: "산책" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/api/places?category=%EC%82%B0%EC%B1%85");
  });

  it("백엔드가 꺼져 있어도 목데이터로 목록을 채운다 — 빈 화면을 만들지 않는다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderWithClient(() => usePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlaces);
  });

  it("서버가 5xx를 줘도 같은 폴백을 쓴다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const { result } = renderWithClient(() => usePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlaces);
  });

  it("폴백에서도 자치구·카테고리 조건은 지킨다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderWithClient(() => usePlaces({ district: mockDistrict }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.length).toBeGreaterThan(0);
    result.current.data?.forEach((place) => expect(place.district).toBe(mockDistrict));
  });

  it("폴백에서는 source 조건을 못 지킨다 — 목데이터에 출처 구분이 없다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderWithClient(() => usePlaces({ source: "petacp" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlaces);
  });

  it("조건이 다르면 캐시를 따로 쓴다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);

    const first = renderHook(() => usePlaces({ district: "서구" }), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    const second = renderHook(() => usePlaces({ district: "중구" }), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("같은 조건이면 캐시를 재사용한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);

    const first = renderHook(() => usePlaces({ district: "서구" }), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    renderHook(() => usePlaces({ district: "서구" }), { wrapper });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
