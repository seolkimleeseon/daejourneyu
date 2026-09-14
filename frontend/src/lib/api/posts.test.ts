import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPostApi,
  deletePostApi,
  fetchPostApi,
  fetchPostsApi,
  savePostApi,
  unsavePostApi,
  updatePostApi,
  type PostCreateInput,
} from "@/lib/api/posts";
import { makeApiPost, makeStop } from "@/test/fixtures";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** fetch에 넘어간 [url, init]. */
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

describe("fetchPostsApi", () => {
  it("조건이 없으면 쿼리스트링 없이 인증 쿠키를 실어 부른다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null, total: 0 }));

    await expect(fetchPostsApi()).resolves.toEqual({ items: [], nextCursor: null, total: 0 });

    const [url, init] = lastCall();
    expect(url).toBe("/api/posts");
    expect(init.credentials).toBe("include");
  });

  it("검색·정렬·유형·내 글·커서·개수를 서버 쿼리 이름으로 옮긴다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await fetchPostsApi({
      keyword: "한빛탑",
      sort: "recent",
      sameTypeName: "정겹게 달려가는 페스티벌맨",
      mine: true,
      cursor: "post-9",
      limit: 10,
    });

    const params = new URL(lastCall()[0], "http://localhost").searchParams;
    expect(Object.fromEntries(params)).toEqual({
      q: "한빛탑",
      sort: "recent",
      sameType: "정겹게 달려가는 페스티벌맨",
      mine: "true",
      cursor: "post-9",
      limit: "10",
    });
  });

  it("빈 검색어·유형 없음·첫 페이지 커서는 보내지 않는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [], nextCursor: null }));

    await fetchPostsApi({ keyword: "", sameTypeName: null, cursor: null, sort: "saves" });

    expect(lastCall()[0]).toBe("/api/posts?sort=saves");
  });

  it("응답이 실패면 화면에 띄울 문구로 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "x" }, 500));
    await expect(fetchPostsApi()).rejects.toThrow("둘러보기 글을 불러오지 못했어요");
  });
});

describe("fetchPostApi", () => {
  it("게시물 하나를 받아온다", async () => {
    const post = makeApiPost({ id: "post-1" });
    fetchMock.mockResolvedValue(jsonResponse(post));

    await expect(fetchPostApi("post-1")).resolves.toEqual(post);
    expect(lastCall()[0]).toBe("/api/posts/post-1");
  });

  it("없는 글(404)은 에러가 아니라 null이다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "없음" }, 404));
    await expect(fetchPostApi("gone")).resolves.toBeNull();
  });

  it("그 밖의 실패는 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "x" }, 500));
    await expect(fetchPostApi("post-1")).rejects.toThrow("게시물을 불러오지 못했어요");
  });
});

describe("담기", () => {
  it("담기는 POST, 취소는 DELETE로 같은 경로를 부른다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ saves: 4, saved: true, courseId: "copy-1" }));
    await expect(savePostApi("post-1")).resolves.toEqual({ saves: 4, saved: true, courseId: "copy-1" });
    expect(lastCall()).toEqual(["/api/posts/post-1/save", { method: "POST", credentials: "include" }]);

    fetchMock.mockResolvedValue(jsonResponse({ saves: 3, saved: false }));
    await unsavePostApi("post-1");
    expect(lastCall()).toEqual(["/api/posts/post-1/save", { method: "DELETE", credentials: "include" }]);
  });

  it("실패하면 각각의 문구로 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 400));
    await expect(savePostApi("post-1")).rejects.toThrow("코스를 담지 못했어요");
    fetchMock.mockResolvedValue(jsonResponse({}, 400));
    await expect(unsavePostApi("post-1")).rejects.toThrow("담기를 취소하지 못했어요");
  });
});

describe("작성·수정·삭제", () => {
  const input: PostCreateInput = {
    caption: "갑천 1박 코스",
    text: "좋았어요",
    stops: [makeStop()],
    tags: ["1박 2일", "서구"],
    authorName: "콩이네",
    authorEmoji: "🐶",
    petTypeName: "유형",
    courseId: "course-1",
  };

  it("작성은 JSON 본문으로 POST 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeApiPost({ id: "new" }), 201));

    await expect(createPostApi(input)).resolves.toMatchObject({ id: "new" });

    const [url, init] = lastCall();
    expect(url).toBe("/api/posts");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("수정은 고칠 필드만 PATCH 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeApiPost({ caption: "새 이름" })));

    await updatePostApi("post-1", { caption: "새 이름" });

    const [url, init] = lastCall();
    expect(url).toBe("/api/posts/post-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ caption: "새 이름" });
  });

  it("삭제는 DELETE 하고 본문을 기대하지 않는다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deletePostApi("post-1")).resolves.toBeUndefined();
    expect(lastCall()).toEqual(["/api/posts/post-1", { method: "DELETE", credentials: "include" }]);
  });

  it("실패하면 각각의 문구로 던진다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 400));
    await expect(createPostApi(input)).rejects.toThrow("게시물을 올리지 못했어요");
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    await expect(updatePostApi("post-1", { text: "" })).rejects.toThrow("게시물을 수정하지 못했어요");
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    await expect(deletePostApi("post-1")).rejects.toThrow("게시물을 삭제하지 못했어요");
  });
});
