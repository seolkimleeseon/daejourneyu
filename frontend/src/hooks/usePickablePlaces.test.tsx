import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";
import { makePlace } from "@/test/fixtures";

const fetchMock = vi.fn();

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

const places = [{ ...makePlace({ id: "p1" }), imageUrl: "https://img/a.jpg", sourceTier: 1 }];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify(places), { headers: { "Content-Type": "application/json" } })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePickablePlaces", () => {
  it("장소 테이블 전체를 한 번에 가져온다 — 소스별로 나눠 부르지 않는다", async () => {
    const { result } = renderWithClient(() => usePickablePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/places");
    expect(result.current.data).toEqual(places);
  });

  it("사진·신뢰도 같은 추가 필드도 그대로 들고 온다", async () => {
    const { result } = renderWithClient(() => usePickablePlaces());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({
      imageUrl: "https://img/a.jpg",
      sourceTier: 1,
    });
  });

  it("enabled=false면 요청하지 않는다 — 시트가 열릴 때만 필요하다", () => {
    const { result } = renderWithClient(() => usePickablePlaces(false));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("실패하면 오류로 둔다 — 여기엔 목데이터 폴백이 없다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const { result } = renderWithClient(() => usePickablePlaces());
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
  });
});
