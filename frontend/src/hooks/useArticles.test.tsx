import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useArticle, useArticles } from "@/hooks/useArticles";
import { mockArticles } from "@/mocks";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

function wrapper() {
  return createQueryWrapper(createTestQueryClient());
}

describe("useArticles", () => {
  it("아티클 목록을 돌려준다", async () => {
    const { result } = renderHook(() => useArticles(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockArticles);
  });
});

describe("useArticle", () => {
  it("목록에서 id로 하나를 골라낸다", async () => {
    expect(mockArticles.length).toBeGreaterThan(0);
    const target = mockArticles[mockArticles.length - 1];

    const { result } = renderHook(() => useArticle(target.id), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(target);
  });

  it("없는 id면 null", async () => {
    const { result } = renderHook(() => useArticle("no-such-article"), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });
});
