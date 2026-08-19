import type { FeedPost } from "@/types";
import type { FeedInteraction } from "@/stores/useFeedStore";

export interface ResolvedPostInteraction {
  liked: boolean;
  likes: number;
  saved: boolean;
  saves: number;
}

/**
 * 원본 게시물 + 사용자가 토글한 오버라이드를 합쳐 화면에 보일 값을 계산한다.
 * 카운트는 원본 값에서 토글 여부만큼만 가감한다(서버 재조회 없이 낙관적 표시).
 */
export function resolvePostInteraction(
  post: FeedPost,
  override: FeedInteraction | undefined
): ResolvedPostInteraction {
  const liked = override?.liked ?? post.liked;
  const saved = override?.saved ?? post.saved;

  return {
    liked,
    likes: post.likes + (liked === post.liked ? 0 : liked ? 1 : -1),
    saved,
    saves: post.saves + (saved === post.saved ? 0 : saved ? 1 : -1),
  };
}

/** 코스 게시물의 방문 장소를 "한밭수목원 › 댕댕 베이커리" 형태의 한 줄 요약으로 만든다. */
export function formatStopSummary(post: FeedPost): string {
  return post.stops.map((stop) => stop.name).join(" › ");
}

/** 아티클 좋아요 — 게시물과 동일하게 원본 값 + 토글 오버라이드로 표시값을 계산한다. */
export function resolveArticleLike(
  article: { likes: number; liked: boolean },
  override: boolean | undefined
): { liked: boolean; likes: number } {
  const liked = override ?? article.liked;
  return { liked, likes: article.likes + (liked === article.liked ? 0 : liked ? 1 : -1) };
}
