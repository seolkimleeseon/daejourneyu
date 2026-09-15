import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { makeArticle, makeUser } from "@/test/fixtures";
import ArticleDetailPage from "./page";

const nav = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "a1" }),
  useRouter: () => nav,
  // 좋아요 게이팅에 쓰는 LoginModal이 현재 경로를 next로 붙인다.
  usePathname: () => "/article/a1",
}));

const hooks = vi.hoisted(() => ({ useArticle: vi.fn() }));
vi.mock("@/hooks/useArticles", () => ({ useArticle: hooks.useArticle }));

/** jsdom의 history.length는 1에서 시작한다. 되돌아갈 기록이 있는 상황은 값을 덮어써 흉내 낸다. */
function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { configurable: true, get: () => length });
}

beforeEach(() => {
  vi.clearAllMocks();
  useFeedStore.setState({ overrides: {}, articleLikes: {} });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: makeUser() });
  hooks.useArticle.mockReturnValue({
    data: makeArticle({
      id: "a1",
      title: "대전 산책로 모음",
      summary: "그늘 많은 곳",
      body: "첫 줄\n둘째 줄",
      date: "2026-08-12",
      views: 1234,
      likes: 5,
      liked: false,
    }),
    isLoading: false,
  });
});

afterEach(() => {
  Reflect.deleteProperty(window.history, "length");
});

describe("아티클 상세", () => {
  it("주소의 id로 불러오고, 불러오는 중에는 문구만 둔다", () => {
    hooks.useArticle.mockReturnValue({ data: null, isLoading: true });
    render(<ArticleDetailPage />);

    expect(hooks.useArticle).toHaveBeenCalledWith("a1");
    expect(screen.getByText("불러오는 중…")).toBeTruthy();
  });

  it("없는 아티클이면 아티클 목록으로 보내는 링크를 준다", () => {
    hooks.useArticle.mockReturnValue({ data: null, isLoading: false });
    render(<ArticleDetailPage />);

    expect(screen.getByText("아티클을 찾을 수 없어요.")).toBeTruthy();
    expect(screen.getByText("다른 아티클 보러가기").getAttribute("href")).toBe("/feed?tab=article");
  });

  it("날짜·조회수·제목·요약·본문과 목록으로 가는 링크를 보여준다", () => {
    render(<ArticleDetailPage />);

    expect(screen.getByText(`2026-08-12 · 조회 ${(1234).toLocaleString()}`)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "대전 산책로 모음" })).toBeTruthy();
    expect(screen.getByText("그늘 많은 곳")).toBeTruthy();
    expect(screen.getByText(/첫 줄/).textContent).toBe("첫 줄\n둘째 줄");
    expect(screen.getByText("📰 다른 아티클 더 보러갈래요").getAttribute("href")).toBe("/feed?tab=article");
  });

  it("도움돼요를 누르면 수가 바뀌고 목록과 같은 스토어에 기록된다", async () => {
    const user = userEvent.setup();
    render(<ArticleDetailPage />);
    const button = screen.getByRole("button", { name: /도움돼요/ });

    expect(button.textContent).toBe("🤍도움돼요 5");
    await user.click(button);

    expect(button.textContent).toBe("❤️도움돼요 6");
    expect(useFeedStore.getState().articleLikes).toEqual({ a1: true });
  });

  it("비로그인 상태에서는 도움돼요를 기록하지 않고 로그인 모달을 띄운다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true, user: null });
    render(<ArticleDetailPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: /도움돼요/ }));

    const loginModal = screen
      .getByText("로그인하면 반려동물 여권과 내 활동을 볼 수 있어요.")
      .closest(".fixed");
    expect(loginModal?.className).toContain("opacity-100");
    expect(useFeedStore.getState().articleLikes).toEqual({});
  });

  it("목록에서 좋아요를 눌렀던 상태를 이어받는다", () => {
    useFeedStore.setState({ articleLikes: { a1: true } });
    render(<ArticleDetailPage />);

    expect(screen.getByRole("button", { name: /도움돼요/ }).textContent).toBe("❤️도움돼요 6");
  });

  it("되돌아갈 기록이 있으면 뒤로 가고, 새 탭으로 열었으면 아티클 목록으로 보낸다", async () => {
    const user = userEvent.setup();

    setHistoryLength(1);
    const { unmount } = render(<ArticleDetailPage />);
    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));
    expect(nav.replace).toHaveBeenCalledWith("/feed?tab=article");
    expect(nav.back).not.toHaveBeenCalled();
    unmount();

    setHistoryLength(3);
    render(<ArticleDetailPage />);
    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));
    expect(nav.back).toHaveBeenCalledTimes(1);
  });
});
