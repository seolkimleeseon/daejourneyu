import { authFetch } from "./authFetch";
import type { FeedPost } from "@/types";

/** 서버가 내려주는 게시물. sameTypeMatch는 "보는 사람"에 따라 달라지므로 서버가 아니라 화면에서 계산한다. */
export type ApiFeedPost = Omit<FeedPost, "sameTypeMatch">;

export async function fetchPostsApi(): Promise<ApiFeedPost[]> {
  const res = await authFetch("/api/posts");
  if (!res.ok) throw new Error("둘러보기 글을 불러오지 못했어요");
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

export async function deletePostApi(id: string): Promise<void> {
  const res = await authFetch(`/api/posts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("게시물을 삭제하지 못했어요");
}
