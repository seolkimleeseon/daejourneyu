import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateReview, useDeleteReview, useReviews } from "@/hooks/useReviews";
import { createReviewApi, deleteReviewApi, fetchReviewsApi } from "@/lib/api/reviews";
import { makeReview } from "@/test/fixtures";
import { createQueryWrapper, createTestQueryClient } from "@/test/query";

vi.mock("@/lib/api/reviews", () => ({
  fetchReviewsApi: vi.fn(),
  createReviewApi: vi.fn(),
  deleteReviewApi: vi.fn(),
}));

function renderWithClient<T>(hook: () => T) {
  const client = createTestQueryClient();
  return { client, ...renderHook(hook, { wrapper: createQueryWrapper(client) }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useReviews", () => {
  it("장소 없이 부르면 전체 후기를 받는다", async () => {
    const reviews = [makeReview(), makeReview({ id: "r2", isMine: false })];
    vi.mocked(fetchReviewsApi).mockResolvedValue(reviews);

    const { client, result } = renderWithClient(() => useReviews());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchReviewsApi).toHaveBeenCalledWith(undefined);
    expect(result.current.data).toEqual(reviews);
    expect(client.getQueryData(["reviews", null])).toEqual(reviews);
  });

  it("장소를 넘기면 그 장소 후기만 따로 캐시한다", async () => {
    vi.mocked(fetchReviewsApi).mockResolvedValue([]);

    const { client, result } = renderWithClient(() => useReviews("place-1"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchReviewsApi).toHaveBeenCalledWith("place-1");
    expect(client.getQueryData(["reviews", "place-1"])).toEqual([]);
  });
});

describe("후기 작성·삭제", () => {
  it("작성하면 후기 캐시 전체를 무효화한다", async () => {
    vi.mocked(createReviewApi).mockResolvedValue(makeReview());
    const { client, result } = renderWithClient(() => useCreateReview());
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const input = { placeId: "place-1", placeName: "한밭수목원", tagCodes: ["LEASH_REQUIRED"] };

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    expect(createReviewApi).toHaveBeenCalledWith(input);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["reviews"] });
  });

  it("삭제하면 후기 캐시 전체를 무효화한다", async () => {
    vi.mocked(deleteReviewApi).mockResolvedValue(undefined);
    const { client, result } = renderWithClient(() => useDeleteReview());
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await act(async () => {
      await result.current.mutateAsync("review-1");
    });

    expect(deleteReviewApi).toHaveBeenCalledWith("review-1");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["reviews"] });
  });
});
