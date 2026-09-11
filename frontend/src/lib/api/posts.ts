import { authFetch } from "./authFetch";
import type { FeedPost } from "@/types";

/** 서버가 내려주는 게시물. sameTypeMatch는 "보는 사람"에 따라 달라지므로 서버가 아니라 화면에서 계산한다. */
export type ApiFeedPost = Omit<FeedPost, "sameTypeMatch">;

/** 코스 탭 정렬. `src/lib/feed.ts`의 PostSortMode와 값이 같아야 한다(그대로 쿼리스트링에 실린다). */
export type PostSortParam = "saves" | "recent";

export interface PostListParams {
  /** 검색어. 있으면 서버가 유형 필터를 무시하고 전체를 훑는다. */
  keyword?: string;
  sort?: PostSortParam;
  /** 같은 유형만 보기. 뷰어의 반려동물 MBTI 풀네임을 그대로 넘긴다. */
  sameTypeName?: string | null;
  /** 내 글만. 로그인 상태에서만 호출할 것(비로그인은 401). */
  mine?: boolean;
  cursor?: string | null;
  limit?: number;
}

/** 커서 페이지. nextCursor가 null이면 마지막 페이지다. */
export interface PostPage {
  items: ApiFeedPost[];
  nextCursor: string | null;
  /** 조건에 맞는 전체 건수. 첫 페이지에서만 내려온다(이어 받을 때는 셀 이유가 없다). */
  total?: number;
}

function buildListQuery({
  keyword,
  sort,
  sameTypeName,
  mine,
  cursor,
  limit,
}: PostListParams): string {
  const params = new URLSearchParams();
  if (keyword) params.set("q", keyword);
  if (sort) params.set("sort", sort);
  if (sameTypeName) params.set("sameType", sameTypeName);
  if (mine) params.set("mine", "true");
  if (cursor) params.set("cursor", cursor);
  if (limit !== undefined) params.set("limit", String(limit));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export async function fetchPostsApi(params: PostListParams = {}): Promise<PostPage> {
  const res = await authFetch(`/api/posts${buildListQuery(params)}`);
  if (!res.ok) throw new Error("둘러보기 글을 불러오지 못했어요");
  return res.json();
}

/**
 * 게시물 단건. 목록이 페이지 단위로 바뀌면서 상세 화면이 목록 캐시만으로는 글을 못 찾을 수 있어
 * (딥링크로 바로 들어오거나, 아직 안 불러온 뒤쪽 페이지의 글) 별도 조회가 필요하다.
 */
export async function fetchPostApi(id: string): Promise<ApiFeedPost | null> {
  const res = await authFetch(`/api/posts/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("게시물을 불러오지 못했어요");
  return res.json();
}

/** 담기/취소 후 서버가 알려주는 최종 상태. 담긴 수는 서버 값이 정본이다. */
export interface PostSaveResult {
  saves: number;
  saved: boolean;
  /** 담기로 보관함에 만들어진 코스 id. 취소 응답에는 없다. */
  courseId?: string | null;
}

/** 담기 — 남의 코스를 내 보관함에 사본으로 만든다. 두 번 눌러도 사본은 하나다(서버가 멱등 처리). */
export async function savePostApi(id: string): Promise<PostSaveResult> {
  const res = await authFetch(`/api/posts/${id}/save`, { method: "POST" });
  if (!res.ok) throw new Error("코스를 담지 못했어요");
  return res.json();
}

/** 담기 취소 — 보관함 사본도 같이 사라진다. */
export async function unsavePostApi(id: string): Promise<PostSaveResult> {
  const res = await authFetch(`/api/posts/${id}/save`, { method: "DELETE" });
  if (!res.ok) throw new Error("담기를 취소하지 못했어요");
  return res.json();
}

/** 자랑하기에서 서버로 보내는 값 — id·좋아요·담기 수는 서버가 정한다. */
export type PostCreateInput = Pick<
  FeedPost,
  "caption" | "text" | "stops" | "tags" | "authorName" | "authorEmoji" | "petTypeName"
> & { courseId?: string };

export async function createPostApi(input: PostCreateInput): Promise<ApiFeedPost> {
  const res = await authFetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("게시물을 올리지 못했어요");
  return res.json();
}

/** 글에서 고칠 수 있는 값 — 동선·태그는 보관함 코스에서 박제된 값이라 글에서 수정하지 않는다. */
export type PostUpdateInput = Partial<Pick<FeedPost, "caption" | "text">>;

export async function updatePostApi(id: string, input: PostUpdateInput): Promise<ApiFeedPost> {
  const res = await authFetch(`/api/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("게시물을 수정하지 못했어요");
  return res.json();
}

export async function deletePostApi(id: string): Promise<void> {
  const res = await authFetch(`/api/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("게시물을 삭제하지 못했어요");
}
