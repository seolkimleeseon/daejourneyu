import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchArticleLikes, setArticleLikeApi } from "@/lib/api/articleLikes";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("fetchArticleLikes", () => {
  it("아티클별 수와 내가 누른 목록을 가져온다", async () => {
    const body = { counts: { "article-1": 2 }, likedIds: ["article-1"] };
    fetchMock.mockResolvedValue(jsonResponse(body));

    expect(await fetchArticleLikes()).toEqual(body);
    expect(fetchMock).toHaveBeenCalledWith("/api/articles/likes", { credentials: "include" });
  });

  it("실패하면 사유를 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    await expect(fetchArticleLikes()).rejects.toThrow("도움돼요 정보를 불러오지 못했어요");
  });
});

describe("setArticleLikeApi", () => {
  it("누르면 PUT, 취소하면 DELETE로 보낸다", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ articleId: "article-1", liked: true, count: 1 }));

    await setArticleLikeApi("article-1", true);
    await setArticleLikeApi("article-1", false);

    expect(fetchMock.mock.calls[0][0]).toBe("/api/articles/article-1/like");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PUT" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  it("실패하면 사용자에게 보여줄 문구를 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 401));

    await expect(setArticleLikeApi("article-1", true)).rejects.toThrow("도움돼요를 저장하지 못했어요");
  });
});
