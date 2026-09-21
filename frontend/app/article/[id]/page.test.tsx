import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { makeArticle, makeUser } from "@/test/fixtures";
import { icon3D } from "@/test/icon3d";
import ArticleDetailPage from "./page";

const nav = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "a1" }),
  useRouter: () => nav,
  // 좋아요 게이팅에 쓰는 LoginModal이 현재 경로를 next로 붙인다.
  usePathname: () => "/article/a1",
}));

const likes = vi.hoisted(() => ({
  state: { counts: {} as Record<string, number>, likedIds: [] as string[] },
  mutate: vi.fn(),
  isPending: false,
}));
vi.mock("@/hooks/useArticleLikes", () => ({
  useArticleLikes: () => ({ data: likes.state }),
  useToggleArticleLike: () => ({ mutate: likes.mutate, isPending: likes.isPending }),
}));

const hooks = vi.hoisted(() => ({ useArticle: vi.fn(), usePlaces: vi.fn() }));
vi.mock("@/hooks/useArticles", () => ({ useArticle: hooks.useArticle }));
vi.mock("@/hooks/usePlaces", () => ({ usePlaces: hooks.usePlaces }));

/** jsdom의 history.length는 1에서 시작한다. 되돌아갈 기록이 있는 상황은 값을 덮어써 흉내 낸다. */
function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", { configurable: true, get: () => length });
}

beforeEach(() => {
  vi.clearAllMocks();
  likes.state = { counts: {}, likedIds: [] };
  likes.isPending = false;
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
  hooks.usePlaces.mockReturnValue({ data: [], isLoading: false });
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
    expect(screen.getByText("다른 아티클 더 보러갈래요").closest("a")?.getAttribute("href")).toBe(
      "/feed?tab=article"
    );
  });

  it("본문에 나온 장소가 있으면 목록으로 보여주고 상세로 연결한다", () => {
    hooks.useArticle.mockReturnValue({
      data: makeArticle({ id: "a1", places: ["성심당 본점", "존재하지 않는 곳"] }),
      isLoading: false,
    });
    hooks.usePlaces.mockReturnValue({
      data: [{ id: "place-7", name: "성심당 본점", district: "중구", condition: "포장만 가능" }],
      isLoading: false,
    });
    render(<ArticleDetailPage />);

    expect(screen.getByText("성심당 본점")).toBeTruthy();
    expect(screen.getByText("중구 · 포장만 가능")).toBeTruthy();
    expect(screen.getByText("성심당 본점").closest("a")?.getAttribute("href")).toBe(
      `/place/${encodeURIComponent("성심당 본점")}`
    );
    // 목데이터에 없는 장소도 이름은 보여주되, 조건 문구 없이 링크만 살아있다.
    expect(screen.getByText("존재하지 않는 곳")).toBeTruthy();
  });

  it("본문에 나온 장소가 없으면 목록 섹션을 그리지 않는다", () => {
    render(<ArticleDetailPage />);
    expect(screen.queryByText("이 아티클에 나온 장소")).toBeNull();
  });

  it("도움돼요를 누르면 서버에 누른 것으로 요청한다", async () => {
    const user = userEvent.setup();
    render(<ArticleDetailPage />);
    const button = screen.getByRole("button", { name: /도움돼요/ });

    expect(button.textContent).toBe("도움돼요 5");
    expect(icon3D("white_heart_3d.png", button)).toBeTruthy();
    await user.click(button);

    expect(likes.mutate).toHaveBeenCalledWith({ articleId: "a1", next: true }, expect.anything());
  });

  it("비로그인 상태에서는 도움돼요를 요청하지 않고 로그인 모달을 띄운다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true, user: null });
    render(<ArticleDetailPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: /도움돼요/ }));

    const loginModal = screen
      .getByText("로그인하면 반려동물 여권과 내 활동을 볼 수 있어요.")
      .closest(".fixed");
    expect(loginModal?.className).toContain("opacity-100");
    expect(likes.mutate).not.toHaveBeenCalled();
  });

  it("서버에서 이미 누른 아티클이면 눌린 모양으로 열리고, 다시 누르면 취소를 요청한다", async () => {
    likes.state = { counts: { a1: 1 }, likedIds: ["a1"] };
    const user = userEvent.setup();
    render(<ArticleDetailPage />);

    const button = screen.getByRole("button", { name: /도움돼요/ });
    expect(button.textContent).toBe("도움돼요 6");
    expect(icon3D("red_heart_3d.png", button)).toBeTruthy();

    await user.click(button);
    expect(likes.mutate).toHaveBeenCalledWith({ articleId: "a1", next: false }, expect.anything());
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
