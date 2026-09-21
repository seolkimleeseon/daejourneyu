import { authFetch } from "./authFetch";

export interface ArticleLikesResponse {
  /** 아티클 id → 실제 사용자가 누른 도움돼요 수(목데이터의 기본 수는 포함하지 않는다). */
  counts: Record<string, number>;
  /** 내가 누른 아티클 id. 비로그인이면 빈 배열. */
  likedIds: string[];
}

export async function fetchArticleLikes(): Promise<ArticleLikesResponse> {
  const res = await authFetch("/api/articles/likes");
  if (!res.ok) throw new Error("도움돼요 정보를 불러오지 못했어요");
  return res.json();
}

/** 도움돼요를 누르거나(next=true) 취소한다(next=false). 서버가 멱등이라 재시도해도 안전하다. */
export async function setArticleLikeApi(
  articleId: string,
  next: boolean
): Promise<{ articleId: string; liked: boolean; count: number }> {
  const res = await authFetch(`/api/articles/${encodeURIComponent(articleId)}/like`, {
    method: next ? "PUT" : "DELETE",
  });
  if (!res.ok) throw new Error("도움돼요를 저장하지 못했어요. 잠시 후 다시 시도해주세요");
  return res.json();
}
