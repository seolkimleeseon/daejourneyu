import type { Article, Course, FeedPost, FeedStop } from "@/types";
import type { PostCreateInput } from "@/lib/api/posts";
import type { FeedInteraction } from "@/stores/useFeedStore";
import { nightsLabel } from "@/lib/courseFormat";
import { DISTRICTS } from "@/lib/placeFilters";

export interface ResolvedPostInteraction {
  liked: boolean;
  likes: number;
  saved: boolean;
  saves: number;
}

/**
 * 화면에 보일 값을 계산한다.
 *
 * 담기(saved/saves)는 서버가 정본이라 게시물 값을 그대로 쓴다 — 낙관적 표시는 useToggleSave가
 * 쿼리 캐시를 직접 갈아끼우는 쪽에서 처리한다. 아직 서버가 없는 좋아요만 로컬 오버라이드로 덮는다.
 */
export function resolvePostInteraction(
  post: FeedPost,
  override: FeedInteraction | undefined
): ResolvedPostInteraction {
  const liked = override?.liked ?? post.liked;

  return {
    liked,
    likes: post.likes + (liked === post.liked ? 0 : liked ? 1 : -1),
    saved: post.saved,
    saves: post.saves,
  };
}

/** 코스 게시물의 방문 장소를 "한밭수목원 › 댕댕 베이커리" 형태의 한 줄 요약으로 만든다. */
export function formatStopSummary(post: FeedPost): string {
  return post.stops.map((stop) => stop.name).join(" › ");
}

export interface ArticleBodyBlock {
  type: "heading" | "paragraph";
  text: string;
}

/**
 * 아티클 본문을 소제목·문단 블록으로 나눈다. 빈 줄(`\n\n`)로 문단을 가르고, `## `로 시작하는
 * 줄은 소제목으로 취급한다 — 상세 화면이 소제목마다 사진을 한 장씩 끼워 넣을 자리를 잡는 데 쓴다.
 */
export function parseArticleBody(body: string): ArticleBodyBlock[] {
  return body
    .split("\n\n")
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) =>
      block.startsWith("## ")
        ? { type: "heading" as const, text: block.slice(3).trim() }
        : { type: "paragraph" as const, text: block }
    );
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
  return [...articles].sort((a, b) => {
    // 좋아요 수가 같으면 최신 글을 위로 — 동률일 때 순서가 렌더마다 흔들리지 않게 한다.
    if (mode === "popular" && b.likes !== a.likes) return b.likes - a.likes;
    return b.date.localeCompare(a.date);
  });
}

/** 아티클 카드의 날짜 표기 — 프로토타입 jyFmt와 동일하게 "8월 12일" 형태로 줄인다. */
export function formatFeedDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

/**
 * 게시물 카드의 등록일 표기 — createdAt은 ISO 문자열이라 날짜 부분만 잘라 쓴다.
 * 같은 해면 아티클과 똑같이 "8월 12일", 해가 넘어간 글만 연도를 붙여 구분한다.
 */
export function formatPostDate(createdAt: string): string {
  const [year, month, day] = createdAt.slice(0, 10).split("-");
  if (!year || !month || !day) return "";
  const label = `${Number(month)}월 ${Number(day)}일`;
  return Number(year) === new Date().getFullYear() ? label : `${year}년 ${label}`;
}

/** 자랑하기 글에 자동으로 붙는 태그 — 코스를 훑어볼 때 필요한 일정 길이와 자치구만 넣는다. */
function buildCourseTags(course: Course): string[] {
  const stops = course.days.flat();
  const districts = [...new Set(stops.map((stop) => stop.district))];
  return [nightsLabel(course.nights), ...districts];
}

/** "당일치기" 또는 "2박 3일" — nightsLabel이 만들어내는 두 가지 형태. */
const NIGHTS_TAG_PATTERN = /^(당일치기|\d+박 \d+일)$/;
const DISTRICT_TAGS = new Set<string>(DISTRICTS);

/**
 * 화면에 실제로 보여줄 태그만 남긴다 — 일정 길이와 자치구 둘뿐이다.
 *
 * 예전에 올라간 글에는 이동수단("자차"/"대중교통")이나 견종 태그가 섞여 있는데, 목록에서
 * 코스를 고를 때 훑는 정보는 "며칠짜리인지"와 "어느 동네인지"라 나머지는 태그 줄만 길게 만든다.
 * 저장된 값을 지우지 않고 표시할 때 거르는 이유는 이동수단 태그를 담기(보관함 사본)가
 * 아직 참고하기 때문이다 — backend/src/routes/posts.ts의 buildSavedCourseData 참고.
 */
export function visiblePostTags(tags: string[]): string[] {
  return tags.filter((tag) => NIGHTS_TAG_PATTERN.test(tag) || DISTRICT_TAGS.has(tag));
}

/**
 * 한 줄로 펼쳐진 게시물 동선을 일차별로 다시 묶는다 — 1박 2일 코스가 상세 화면에서
 * 하루에 다 돈 것처럼 보이지 않게 하려는 것이다.
 *
 * 일차를 저장하기 전에 올라간 글은 모든 장소가 0일차라, 결과가 한 덩어리로 나온다.
 * 화면은 묶음이 하나면 일차 제목을 붙이지 않으므로 예전 글도 예전처럼 보인다.
 */
export function groupStopsByDay(stops: FeedStop[]): FeedStop[][] {
  const byDay = new Map<number, FeedStop[]>();
  stops.forEach((stop) => {
    const dayIndex = stop.dayIndex ?? 0;
    const bucket = byDay.get(dayIndex);
    if (bucket) bucket.push(stop);
    else byDay.set(dayIndex, [stop]);
  });
  return [...byDay.entries()].sort(([a], [b]) => a - b).map(([, day]) => day);
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
    stops: course.days.flatMap((day, dayIndex) => day.map((stop) => ({ ...stop, dayIndex }))),
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

export interface PagedResult<T> {
  items: T[];
  /** 실제로 보여준 페이지 번호(0-base). 넘겨받은 page가 범위를 벗어나면 잘라낸 값이 돌아온다. */
  page: number;
  totalPages: number;
}

/**
 * 목록을 페이지 단위로 자른다.
 *
 * 넘겨받은 `page`를 그대로 믿지 않고 범위 안으로 가둔 뒤 자르는 게 핵심이다 — 마지막 페이지의
 * 마지막 항목을 지우면(내가 쓴 후기 삭제) 페이지 수가 줄면서 현재 페이지가 빈 화면이 된다.
 * 호출부가 state를 되돌리기 전에 렌더가 먼저 돌기 때문에, 자를 때 같이 보정해서 돌려준다.
 */
export function paginate<T>(items: T[], page: number, perPage: number): PagedResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * perPage;

  return { items: items.slice(start, start + perPage), page: safePage, totalPages };
}
