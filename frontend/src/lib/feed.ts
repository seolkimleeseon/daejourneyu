import type { Article, Course, FeedPost } from "@/types";
import type { PostCreateInput } from "@/lib/api/posts";
import type { FeedInteraction } from "@/stores/useFeedStore";
import { nightsLabel } from "@/lib/courseFormat";

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

export function sortArticles(articles: Article[], mode: ArticleSortMode): Article[] {
  return [...articles].sort((a, b) =>
    mode === "popular" ? b.likes - a.likes : b.date.localeCompare(a.date)
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

/** 자랑하기 글에 자동으로 붙는 태그 — 코스에서 뽑아낼 수 있는 것만 넣는다(일정·이동수단·자치구). */
function buildCourseTags(course: Course): string[] {
  const stops = course.days.flat();
  const districts = [...new Set(stops.map((stop) => stop.district))];
  return [nightsLabel(course.nights), course.transport, ...districts];
}

export interface CoursePostAuthor {
  name: string;
  emoji: string;
  petTypeName: string;
}

/**
 * 보관함 코스 하나를 둘러보기에 올릴 형태로 옮긴다.
 * 사용자가 직접 쓰는 건 한마디(text)뿐이고, 제목·동선·태그는 코스에서 그대로 끌어온다.
 * id와 좋아요·담기 수는 서버(POST /api/posts)가 정하므로 여기서 만들지 않는다.
 */
export function buildPostInputFromCourse(
  course: Course,
  text: string,
  author: CoursePostAuthor
): PostCreateInput {
  return {
    caption: course.label,
    text: text.trim(),
    stops: course.days.flat(),
    tags: buildCourseTags(course),
    authorName: author.name,
    authorEmoji: author.emoji,
    petTypeName: author.petTypeName,
    courseId: course.id,
  };
}

/** 이 코스를 이미 자랑했는지 — 같은 코스로 두 번 들어와도 글이 두 개 생기지 않게 막는 데 쓴다. */
export function findPostByCourseId(posts: FeedPost[], courseId: string): FeedPost | null {
  return posts.find((post) => post.courseId === courseId) ?? null;
}
