import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article, FeedPost } from "@/types";
import type { FeedListOptions } from "@/hooks/usePosts";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { usePetStore } from "@/stores/usePetStore";
import { makeArticle, makePet, makePost, PET_TYPE_NAME } from "@/test/fixtures";
import FeedPage from "./page";

const nav = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn(), search: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push, back: nav.back }),
  useSearchParams: () => new URLSearchParams(nav.search),
  usePathname: () => "/feed",
}));

const hooks = vi.hoisted(() => ({
  useFeedPosts: vi.fn(),
  useHottestPost: vi.fn(),
  useToggleSave: vi.fn(),
  useArticles: vi.fn(),
}));
vi.mock("@/hooks/usePosts", () => ({
  useFeedPosts: hooks.useFeedPosts,
  useHottestPost: hooks.useHottestPost,
  useToggleSave: hooks.useToggleSave,
}));
vi.mock("@/hooks/useArticles", () => ({ useArticles: hooks.useArticles }));

const LOGIN_DESCRIPTION = "로그인하면 반려동물 여권과 내 활동을 볼 수 있어요.";

let coursePosts: FeedPost[];
let searchPosts: FeedPost[];
let myPosts: FeedPost[];

function listResult(items: FeedPost[]) {
  return {
    data: items,
    total: items.length,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  };
}

function setArticles(articles: Article[]) {
  hooks.useArticles.mockReturnValue({ data: articles, isLoading: false });
}

/** 코스 탭(내 글이 아닌) 목록 훅에 마지막으로 넘어간 옵션. */
function lastCourseOptions(): FeedListOptions {
  const calls = hooks.useFeedPosts.mock.calls
    .map(([options]) => options as FeedListOptions)
    .filter((options) => !options.mine);
  return calls[calls.length - 1];
}

function loginModalOpen(): boolean {
  return (
    screen.getByText(LOGIN_DESCRIPTION).closest(".fixed")?.className.includes("opacity-100") ?? false
  );
}

/** "총 <b>2</b>개"처럼 태그로 쪼개진 문장을 통째로 찾는다. */
function paragraph(text: string) {
  return screen.queryByText((_, element) => element?.tagName === "P" && element.textContent === text);
}

function articleTitles(): string[] {
  return screen.getAllByText(/^📰 /).map((element) => element.textContent ?? "");
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.search = "";
  coursePosts = [
    makePost({ id: "p1", caption: "갑천 산책 코스" }),
    makePost({ id: "p2", caption: "대덕 맛집 코스" }),
  ];
  searchPosts = [];
  myPosts = [];

  hooks.useFeedPosts.mockImplementation((options: FeedListOptions) =>
    listResult(options.mine ? myPosts : options.keyword ? searchPosts : coursePosts)
  );
  hooks.useHottestPost.mockReturnValue({
    data: makePost({ id: "hot", caption: "가장 많이 담긴 코스", saves: 42 }),
  });
  hooks.useToggleSave.mockReturnValue({ mutate: vi.fn(), isPending: false });
  setArticles([]);

  useAuthStore.setState({ isLoggedIn: false, hydrated: true, user: null });
  usePetStore.setState({ pets: [], activePetIndex: 0 });
  useFeedStore.setState({ overrides: {}, articleLikes: {} });
});

describe("둘러보기 — 코스 탭", () => {
  it("기본 탭은 코스이고 인기 배너·목록·전체 건수를 보여준다", () => {
    render(<FeedPage />);

    expect(screen.getByText("🔥 지금 가장 많이 담아갔어요")).toBeTruthy();
    expect(screen.getByText("가장 많이 담긴 코스")).toBeTruthy();
    expect(screen.getByText("갑천 산책 코스")).toBeTruthy();
    expect(screen.getByText("대덕 맛집 코스")).toBeTruthy();
    expect(paragraph("총 2개")).toBeTruthy();

    expect(lastCourseOptions()).toEqual({
      keyword: "",
      sort: "saves",
      sameTypeOnly: false,
      enabled: true,
    });
    expect(hooks.useHottestPost).toHaveBeenLastCalledWith(true);
    // 내 글 목록은 탭이 열리기 전까지 요청하지 않는다.
    expect(hooks.useFeedPosts).toHaveBeenCalledWith({ sort: "saves", mine: true, enabled: false });
  });

  it("코스가 없으면 건수 대신 빈 상태를 보여준다", () => {
    coursePosts = [];
    render(<FeedPage />);

    expect(screen.getByText("아직 코스가 없어요")).toBeTruthy();
    expect(paragraph("총 0개")).toBeNull();
  });

  it("엔터로 검색하면 검색어를 서버로 넘기고 배너·유형 필터를 감춘다", async () => {
    const user = userEvent.setup();
    render(<FeedPage />);

    await user.type(screen.getByRole("searchbox", { name: "장소로 코스 검색" }), "  한빛탑 {Enter}");

    expect(lastCourseOptions()).toMatchObject({ keyword: "한빛탑" });
    expect(hooks.useHottestPost).toHaveBeenLastCalledWith(false);
    expect(screen.queryByText("🔥 지금 가장 많이 담아갔어요")).toBeNull();
    expect(screen.queryByText(/같은 유형 코스만/)).toBeNull();
    expect(screen.getByText("'한빛탑' 검색 결과가 없어요")).toBeTruthy();
  });

  it("검색 결과가 있으면 검색어와 건수를 함께 보여준다", async () => {
    searchPosts = [makePost({ id: "s1", caption: "한빛탑 야경 코스" })];
    const user = userEvent.setup();
    render(<FeedPage />);

    await user.type(screen.getByRole("searchbox", { name: "장소로 코스 검색" }), "한빛탑{Enter}");

    expect(screen.getByText("한빛탑 야경 코스")).toBeTruthy();
    expect(paragraph("🔍 전체 코스에서 ‘한빛탑’ 검색 · 총 1개")).toBeTruthy();
  });

  it("같은 유형 필터를 켜면 목록 조건에 반영한다", async () => {
    usePetStore.setState({
      pets: [makePet({ mbti: { code: "ENFP", name: PET_TYPE_NAME, theme: "산책", traits: [] } })],
      activePetIndex: 0,
    });
    render(<FeedPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: /같은 유형 · .* 코스만 보기/ }));

    expect(lastCourseOptions()).toMatchObject({ sameTypeOnly: true });
  });

  it("정렬을 바꾸면 목록 조건에 반영한다", async () => {
    const user = userEvent.setup();
    render(<FeedPage />);

    await user.click(screen.getByRole("button", { name: "정렬 기준" }));
    await user.click(screen.getByRole("option", { name: "최신순" }));

    expect(lastCourseOptions()).toMatchObject({ sort: "recent" });
  });

  it("'내 글' 탭에 들어가지 않아도 글쓰기로 바로 갈 수 있는 버튼을 둔다", async () => {
    useAuthStore.setState({ isLoggedIn: true });
    render(<FeedPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: "✎ 코스 자랑하기" }));

    expect(nav.push).toHaveBeenCalledWith("/schedule/vault");
  });

  it("비로그인이면 글쓰기 버튼을 눌러도 로그인 모달부터 띄운다", async () => {
    render(<FeedPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: "✎ 코스 자랑하기" }));

    expect(nav.push).not.toHaveBeenCalledWith("/schedule/vault");
    expect(loginModalOpen()).toBe(true);
  });
});

describe("둘러보기 — 탭 전환", () => {
  it("탭은 히스토리에 쌓지 않고 주소로 바꾸며, 기본 탭은 주소에서 생략한다", async () => {
    useAuthStore.setState({ isLoggedIn: true });
    const user = userEvent.setup();
    render(<FeedPage />);

    await user.click(screen.getByRole("button", { name: "아티클" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/feed?tab=article", { scroll: false });

    await user.click(screen.getByRole("button", { name: "내 글" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/feed?tab=mine", { scroll: false });

    await user.click(screen.getByRole("button", { name: "코스" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/feed", { scroll: false });
  });

  it("비로그인으로 내 글을 누르면 탭을 바꾸지 않고 로그인 모달을 띄운다", async () => {
    render(<FeedPage />);
    expect(loginModalOpen()).toBe(false);

    await userEvent.setup().click(screen.getByRole("button", { name: "내 글" }));

    expect(loginModalOpen()).toBe(true);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("세션 복구 전에는 내 글을 눌러도 아무 일도 일어나지 않는다", async () => {
    useAuthStore.setState({ hydrated: false });
    render(<FeedPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: "내 글" }));

    expect(loginModalOpen()).toBe(false);
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("비로그인이 주소로 내 글 탭에 들어오면 코스 탭을 보여준다", () => {
    nav.search = "tab=mine";
    render(<FeedPage />);

    expect(screen.getByText("갑천 산책 코스")).toBeTruthy();
    expect(screen.queryByText("✎ 새 코스 자랑하기")).toBeNull();
  });
});

describe("둘러보기 — 아티클 탭", () => {
  const articles = [
    makeArticle({ id: "a", title: "좋아요 적은 글", likes: 1, date: "2026-08-10" }),
    makeArticle({ id: "b", title: "인기 옛날 글", likes: 9, date: "2026-08-01" }),
    makeArticle({ id: "c", title: "인기 최신 글", likes: 9, date: "2026-08-20" }),
  ];

  it("기본은 인기순으로 보여주고, 최신순을 고르면 주소에 정렬을 남긴다", async () => {
    nav.search = "tab=article";
    setArticles(articles);
    const user = userEvent.setup();
    render(<FeedPage />);

    expect(articleTitles()).toEqual(["📰 인기 최신 글", "📰 인기 옛날 글", "📰 좋아요 적은 글"]);
    expect(paragraph("총 3개")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "정렬 기준" }));
    await user.click(screen.getByRole("option", { name: "최신순" }));

    expect(nav.replace).toHaveBeenCalledWith("/feed?tab=article&sort=recent", { scroll: false });
  });

  it("주소에 최신순이 있으면 날짜순으로 보여주고, 인기순으로 돌리면 주소에서 정렬을 뺀다", async () => {
    nav.search = "tab=article&sort=recent";
    setArticles(articles);
    const user = userEvent.setup();
    render(<FeedPage />);

    expect(articleTitles()).toEqual(["📰 인기 최신 글", "📰 좋아요 적은 글", "📰 인기 옛날 글"]);

    await user.click(screen.getByRole("button", { name: "정렬 기준" }));
    await user.click(screen.getByRole("option", { name: "인기순" }));

    expect(nav.replace).toHaveBeenCalledWith("/feed?tab=article", { scroll: false });
  });

  it("아티클이 없으면 빈 상태를 보여준다", () => {
    nav.search = "tab=article";
    render(<FeedPage />);

    expect(screen.getByText("아직 등록된 아티클이 없어요")).toBeTruthy();
    expect(hooks.useFeedPosts).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it("한 번에 4개까지만 펼치고, 더보기를 누르면 나머지를 이어 붙인다", async () => {
    nav.search = "tab=article";
    setArticles(
      Array.from({ length: 6 }, (_, index) =>
        makeArticle({ id: `a${index}`, title: `글 ${index}`, likes: 100 - index })
      )
    );
    const user = userEvent.setup();
    render(<FeedPage />);

    expect(articleTitles()).toHaveLength(4);
    // 건수는 접힌 것과 무관하게 전체를 말한다 — 더 있다는 사실이 더보기 버튼의 근거가 된다.
    expect(paragraph("총 6개")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "아티클 더보기 (2개 남음)" }));

    expect(articleTitles()).toHaveLength(6);
    expect(screen.queryByRole("button", { name: /아티클 더보기/ })).toBeNull();
  });

  it("정렬을 바꾸면 펼친 만큼을 처음으로 되돌린다 — 목록의 의미가 달라지기 때문", async () => {
    nav.search = "tab=article";
    setArticles(
      Array.from({ length: 6 }, (_, index) =>
        makeArticle({ id: `a${index}`, title: `글 ${index}`, likes: 100 - index })
      )
    );
    const user = userEvent.setup();
    render(<FeedPage />);

    await user.click(screen.getByRole("button", { name: "아티클 더보기 (2개 남음)" }));
    expect(articleTitles()).toHaveLength(6);

    await user.click(screen.getByRole("button", { name: "정렬 기준" }));
    await user.click(screen.getByRole("option", { name: "최신순" }));

    expect(articleTitles()).toHaveLength(4);
  });

  it("비로그인 상태에서 좋아요를 누르면 로그인 모달로 보낸다", async () => {
    nav.search = "tab=article";
    setArticles([makeArticle({ id: "a", title: "좋아요 글", likes: 3 })]);
    render(<FeedPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: "♡ 3" }));

    expect(loginModalOpen()).toBe(true);
    expect(useFeedStore.getState().articleLikes).toEqual({});
  });
});

describe("둘러보기 — 내 글 탭", () => {
  beforeEach(() => {
    nav.search = "tab=mine";
    useAuthStore.setState({ isLoggedIn: true });
  });

  it("자랑하기 진입 링크를 두고, 글이 없으면 빈 상태를 보여준다", () => {
    render(<FeedPage />);

    expect(screen.getByText("✎ 새 코스 자랑하기").closest("a")?.getAttribute("href")).toBe(
      "/schedule/vault"
    );
    expect(screen.getByText("아직 자랑한 코스가 없어요")).toBeTruthy();
    expect(hooks.useFeedPosts).toHaveBeenCalledWith({ sort: "saves", mine: true, enabled: true });
  });

  it("내 글을 코스 탭과 같은 카드로 보여준다", () => {
    myPosts = [makePost({ id: "m1", caption: "내가 올린 코스", isMine: true })];
    render(<FeedPage />);

    expect(screen.getByText("내가 올린 코스")).toBeTruthy();
    expect(paragraph("총 1개")).toBeTruthy();
    expect(screen.getByText("🐾 내 코스")).toBeTruthy();
  });
});
