import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createReviewApi,
  deleteReviewApi,
  fetchReviewsApi,
  fetchReviewTagsApi,
} from "@/lib/api/reviews";
import { makeReview } from "@/test/fixtures";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastCall(): [string, RequestInit] {
  const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return [call[0] as string, call[1] as RequestInit];
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchReviewsApi", () => {
  it("장소를 안 넘기면 전체(마이탭용)를 받아온다", async () => {
    const reviews = [makeReview()];
    fetchMock.mockResolvedValue(jsonResponse(reviews));

    await expect(fetchReviewsApi()).resolves.toEqual(reviews);
    expect(lastCall()[0]).toBe("/api/reviews");
    expect(lastCall()[1].credentials).toBe("include");
  });

  it("장소 id는 URL 인코딩해서 붙인다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await fetchReviewsApi("장소 1/2");

    expect(lastCall()[0]).toBe(`/api/reviews?placeId=${encodeURIComponent("장소 1/2")}`);
  });

  it("실패하면 상태 코드를 담아 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));
    await expect(fetchReviewsApi()).rejects.toThrow("GET /api/reviews → 503");
  });
});

describe("fetchReviewTagsApi", () => {
  it("태그 사전을 받아온다", async () => {
    const tags = [{ code: "LEASH_REQUIRED", label: "목줄 필수", category: "PET_CONDITION" }];
    fetchMock.mockResolvedValue(jsonResponse(tags));

    await expect(fetchReviewTagsApi()).resolves.toEqual(tags);
    expect(lastCall()[0]).toBe("/api/reviews/tags");
  });
});

describe("createReviewApi", () => {
  it("JSON 본문으로 POST 한다", async () => {
    const input = { placeId: "place-1", placeName: "한밭수목원", tagCodes: ["LEASH_REQUIRED"] };
    fetchMock.mockResolvedValue(jsonResponse(makeReview(), 201));

    await createReviewApi(input);

    const [url, init] = lastCall();
    expect(url).toBe("/api/reviews");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("실패하면 화면 문구로 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 400));
    await expect(
      createReviewApi({ placeId: "p", placeName: "n", tagCodes: [] })
    ).rejects.toThrow("후기를 등록하지 못했어요");
  });

  it("사진이 너무 크면(413) 용량 문구로 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 413));
    await expect(
      createReviewApi({ placeId: "p", placeName: "n", tagCodes: [] })
    ).rejects.toThrow("사진 용량이 너무 커요");
  });
});

describe("deleteReviewApi", () => {
  it("DELETE 하고, 실패(남의 후기 404 포함)는 던진다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteReviewApi("review-1")).resolves.toBeUndefined();
    expect(lastCall()).toEqual(["/api/reviews/review-1", { method: "DELETE", credentials: "include" }]);

    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    await expect(deleteReviewApi("someone-else")).rejects.toThrow("후기를 삭제하지 못했어요");
  });
});
