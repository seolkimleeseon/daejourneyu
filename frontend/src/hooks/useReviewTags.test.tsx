import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReviewTags } from "@/hooks/useReviewTags";
import { fetchReviewTagsApi } from "@/lib/api/reviews";
import { mockReviewTags } from "@/mocks";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

vi.mock("@/lib/api/reviews", () => ({ fetchReviewTagsApi: vi.fn() }));

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useReviewTags", () => {
  it("서버 사전을 그대로 준다", async () => {
    const tags = [{ code: "LEASH", label: "목줄 필수", category: "PET_CONDITION" }];
    vi.mocked(fetchReviewTagsApi).mockResolvedValue(tags);

    const { result } = renderWithClient(() => useReviewTags());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(tags);
  });

  it("DB가 꺼져 있어도 목데이터로 작성 화면은 열리게 한다", async () => {
    vi.mocked(fetchReviewTagsApi).mockRejectedValue(new Error("연결 실패"));

    const { result } = renderWithClient(() => useReviewTags());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockReviewTags);
    expect(result.current.isError).toBe(false);
  });
});
