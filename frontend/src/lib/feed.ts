import type { Article, FeedPost } from "@/types";
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

/** 코스 탭 정렬 — 프로토타입의 jyBrowseSort('담긴순' | '최신순')에 대응 */
export type PostSortMode = "saves" | "recent";
/** 아티클 탭 정렬 — 프로토타입의 jyArticleSort('인기순' | '최신순')에 대응 */
export type ArticleSortMode = "popular" | "recent";

/**
 * 최신순 정렬에 쓰는 순번. FeedPost에는 작성일 필드가 없어서, 프로토타입이 `b.id - a.id`로
 * 정렬하던 것과 같이 id 끝의 일련번호를 최신도 대용으로 쓴다.
 * TODO(api): 서버 연동 시 createdAt을 받아 그걸로 교체한다.
 */
function postSequence(post: FeedPost): number {
  const matched = /(\d+)$/.exec(post.id);
  return matched ? Number(matched[1]) : 0;
}

/**
 * 장소·문구·작성자·태그를 한꺼번에 훑는 코스 검색.
 * 프로토타입과 동일하게 **유형 필터와 무관하게 항상 전체 코스**를 대상으로 한다.
 */
export function searchPosts(posts: FeedPost[], query: string): FeedPost[] {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return posts;

  return posts.filter(
    (post) =>
      post.stops.some((stop) => stop.name.toLowerCase().includes(keyword)) ||
      post.caption.toLowerCase().includes(keyword) ||
      post.text.toLowerCase().includes(keyword) ||
      post.authorName.toLowerCase().includes(keyword) ||
      post.tags.some((tag) => tag.toLowerCase().includes(keyword))
  );
}

/**
 * 담긴순은 오버라이드가 아니라 **원본 saves**로 정렬한다 — '담기'를 누른 순간 목록이 재배치되면
 * 방금 누른 카드를 눈으로 놓치기 때문이다. 표시 수치만 낙관적으로 올리고 순서는 유지한다.
 */
export function sortPosts(posts: FeedPost[], mode: PostSortMode): FeedPost[] {
  return [...posts].sort((a, b) =>
    mode === "saves" ? b.saves - a.saves : postSequence(b) - postSequence(a)
  );
}

export function sortArticles(articles: Article[], mode: ArticleSortMode): Article[] {
  return [...articles].sort((a, b) =>
    mode === "popular" ? b.likes - a.likes : b.date.localeCompare(a.date)
  );
}

/** '👑 지금 가장 많이 담아갔어요' 배너에 올릴 코스. 목록이 비면 null. */
export function findHottestPost(posts: FeedPost[]): FeedPost | null {
  return posts.reduce<FeedPost | null>(
    (hottest, post) => (!hottest || post.saves > hottest.saves ? post : hottest),
    null
  );
}

export interface PageSlice<T> {
  items: T[];
  /** 범위를 벗어난 요청을 보정한 뒤의 실제 페이지 번호(0부터) */
  page: number;
  totalPages: number;
}

/** 내 글 목록 페이지네이션. 항목이 없어도 totalPages는 1로 둬서 "1/1 페이지"로 표시된다. */
export function paginate<T>(items: T[], page: number, perPage: number): PageSlice<T> {
  const totalPages = Math.max(Math.ceil(items.length / perPage), 1);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);

  return {
    items: items.slice(safePage * perPage, safePage * perPage + perPage),
    page: safePage,
    totalPages,
  };
}

/** 아티클 카드의 날짜 표기 — 프로토타입 jyFmt와 동일하게 "8월 12일" 형태로 줄인다. */
export function formatFeedDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}
