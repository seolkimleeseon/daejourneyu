import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFestivals } from "@/hooks/useFestivals";
import { mockFestivals } from "@/mocks";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

const fetchMock = vi.fn();

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

function apiItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "9001",
    title: "대전 0시 축제",
    date: "2026-08-08",
    endDate: "2026-08-08",
    place: "중앙로",
    address: "대전 중구 중앙로",
    lat: 36.32,
    lng: 127.42,
    imageUrl: null,
    tel: null,
    webUrl: "https://festival.example.com",
    venuePetFriendly: false,
    venuePlaceName: null,
    ...overrides,
  };
}

function festivalsResponse(festivals: unknown[]) {
  return new Response(JSON.stringify({ festivals }), {
    headers: { "Content-Type": "application/json" },
  });
}

const petFriendlyMockCount = mockFestivals.filter((festival) => festival.petFriendly).length;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useFestivals", () => {
  it("동반가능 축제(목데이터)와 실시간 일반 축제를 함께 준다", async () => {
    fetchMock.mockResolvedValue(festivalsResponse([apiItem()]));

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(petFriendlyMockCount + 1);
  });

  it("동반가능 축제를 앞에 둔다", async () => {
    fetchMock.mockResolvedValue(festivalsResponse([apiItem()]));

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].petFriendly).toBe(true);
  });

  it("일반 축제는 동반 여부를 '모름'으로 둔다 — 확정형 배지를 잘못 띄우지 않는다", async () => {
    fetchMock.mockResolvedValue(festivalsResponse([apiItem()]));

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const general = result.current.data?.find((festival) => festival.id === "festival-9001");
    expect(general).toMatchObject({ petFriendly: false, petFriendlyUnknown: true });
  });

  it("열리는 장소가 동반 인증 장소면 안내 문구를 만든다", async () => {
    fetchMock.mockResolvedValue(
      festivalsResponse([
        apiItem({ venuePetFriendly: true, venuePlaceName: "한밭수목원" }),
      ])
    );

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const general = result.current.data?.find((festival) => festival.id === "festival-9001");
    expect(general?.condition).toContain("한밭수목원");
    // 장소가 인증됐다고 행사 규정까지 보장되는 건 아니라는 단서를 함께 남긴다.
    expect(general?.condition).toContain("주최 측에 별도로 확인");
  });

  it("장소 이름을 모르면 이름 없이 안내한다", async () => {
    fetchMock.mockResolvedValue(
      festivalsResponse([apiItem({ venuePetFriendly: true, venuePlaceName: null })])
    );

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.find((f) => f.id === "festival-9001")?.condition).toContain(
      "반려동반 인증 장소"
    );
  });

  it("인증 장소가 아니면 안내 문구를 붙이지 않는다", async () => {
    fetchMock.mockResolvedValue(festivalsResponse([apiItem({ venuePetFriendly: false })]));

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.find((f) => f.id === "festival-9001")?.condition).toBeUndefined();
  });

  it("하루짜리 축제는 종료일을 따로 두지 않는다", async () => {
    fetchMock.mockResolvedValue(
      festivalsResponse([apiItem({ date: "2026-08-08", endDate: "2026-08-08" })])
    );

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.find((f) => f.id === "festival-9001")?.endDate).toBeUndefined();
  });

  it("여러 날 열리면 종료일을 남긴다", async () => {
    fetchMock.mockResolvedValue(
      festivalsResponse([apiItem({ date: "2026-08-08", endDate: "2026-08-17" })])
    );

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.find((f) => f.id === "festival-9001")?.endDate).toBe("2026-08-17");
  });

  it("실시간 조회가 실패해도 동반가능 축제는 보여준다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const { result } = renderWithClient(() => useFestivals());
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

    expect(result.current.data).toHaveLength(petFriendlyMockCount);
  });
});
