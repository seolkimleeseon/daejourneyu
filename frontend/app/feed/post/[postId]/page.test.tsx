import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseStop } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePost, makeStop } from "@/test/fixtures";
import FeedPostDetailPage from "./page";

const nav = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ postId: "post-1" }),
  useRouter: () => nav,
  usePathname: () => "/feed/post/post-1",
}));

const hooks = vi.hoisted(() => ({
  usePost: vi.fn(),
  useUpdatePost: vi.fn(),
  useDeletePost: vi.fn(),
  useToggleSave: vi.fn(),
  updateAsync: vi.fn(),
  deleteAsync: vi.fn(),
}));
vi.mock("@/hooks/usePosts", () => ({
  usePost: hooks.usePost,
  useUpdatePost: hooks.useUpdatePost,
  useDeletePost: hooks.useDeletePost,
  useToggleSave: hooks.useToggleSave,
}));

// 카카오 지도 SDK를 불러오는 컴포넌트라 자리만 차지하는 가짜로 바꾼다.
vi.mock("@/components/course/CourseRouteMap", () => ({
  CourseRouteMap: ({ stops }: { stops: CourseStop[] }) => (
    <div data-testid="route-map">{stops.length}곳 지도</div>
  ),
}));

function showPost(overrides: Parameters<typeof makePost>[0] = {}) {
  hooks.usePost.mockReturnValue({ data: makePost({ id: "post-1", ...overrides }), isLoading: false });
}

function modalOpen(title: string): boolean {
  return screen.getByText(title).closest(".fixed")?.className.includes("opacity-100") ?? false;
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useUpdatePost.mockReturnValue({ mutateAsync: hooks.updateAsync, isPending: false });
  hooks.useDeletePost.mockReturnValue({ mutateAsync: hooks.deleteAsync, isPending: false });
  hooks.useToggleSave.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true });
  useToastStore.setState({ message: null, key: 0 });
});

describe("게시물 상세 — 불러오기", () => {
  it("주소의 글 id로 불러오고, 불러오는 중에는 문구만 둔다", () => {
    hooks.usePost.mockReturnValue({ data: null, isLoading: true });
    render(<FeedPostDetailPage />);

    expect(hooks.usePost).toHaveBeenCalledWith("post-1");
    expect(screen.getByText("불러오는 중…")).toBeTruthy();
  });

  it("없는 글이면 둘러보기로 돌아가는 링크를 준다", () => {
    hooks.usePost.mockReturnValue({ data: null, isLoading: false });
    render(<FeedPostDetailPage />);

    expect(screen.getByText("게시물을 찾을 수 없어요.")).toBeTruthy();
    expect(screen.getByText("둘러보기로 돌아가기").getAttribute("href")).toBe("/feed");
  });
});

describe("게시물 상세 — 내용", () => {
  it("작성자·제목·소개·보이는 태그·방문 장소와 동선 지도, 담긴 수를 보여준다", () => {
    showPost({
      authorName: "두부네",
      caption: "대청호 코스",
      text: "물멍하기 좋아요",
      tags: ["당일치기", "자차", "서구"],
      saves: 5,
      stops: [
        makeStop({ placeId: "a", name: "한밭수목원", district: "서구", category: "산책", condition: "전 견종" }),
        makeStop({ placeId: "b", name: "대청호 오백리길", district: "대덕구", category: "산책", condition: "목줄" }),
      ],
    });
    render(<FeedPostDetailPage />);

    expect(screen.getByText("두부네")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "대청호 코스" })).toBeTruthy();
    expect(screen.getByText("물멍하기 좋아요")).toBeTruthy();
    expect(screen.getByText("당일치기")).toBeTruthy();
    expect(screen.getByText("서구")).toBeTruthy();
    expect(screen.queryByText("자차")).toBeNull();
    expect(screen.getByText("방문 장소 2곳")).toBeTruthy();
    expect(screen.getByTestId("route-map").textContent).toBe("2곳 지도");
    expect(screen.getByText("한밭수목원").closest("a")?.getAttribute("href")).toBe(
      `/place/${encodeURIComponent("한밭수목원")}`
    );
    expect(screen.getByText("서구 · 산책 · 전 견종")).toBeTruthy();
    expect(screen.getByText("5명이 담아감")).toBeTruthy();
  });


  it("여러 날 코스는 일차별로 끊어 보여준다 — 1박 2일이 하루에 다 도는 코스처럼 보이면 안 된다", () => {
    showPost({
      stops: [
        { ...makeStop({ placeId: "a", name: "한밭수목원" }), dayIndex: 0 },
        { ...makeStop({ placeId: "b", name: "대청호 오백리길" }), dayIndex: 1 },
        { ...makeStop({ placeId: "c", name: "댕댕카페" }), dayIndex: 1 },
      ],
    });
    render(<FeedPostDetailPage />);

    expect(screen.getByText("방문 장소 3곳")).toBeTruthy();
    expect(screen.getByText("1일차 · 1곳")).toBeTruthy();
    expect(screen.getByText("2일차 · 2곳")).toBeTruthy();
    // 지도도 일차마다 따로 — 하루 동선을 한 장에 몰아 그리면 이어 다닌 것처럼 읽힌다.
    expect(screen.getAllByTestId("route-map").map((map) => map.textContent)).toEqual([
      "1곳 지도",
      "2곳 지도",
    ]);
    // 번호는 일차마다 1부터 다시 센다.
    expect(screen.getAllByText("1").length).toBe(2);
  });

  it("일차를 저장하기 전에 올라간 글은 예전처럼 한 덩어리로 보여준다", () => {
    showPost({
      stops: [makeStop({ placeId: "a", name: "한밭수목원" }), makeStop({ placeId: "b", name: "댕댕카페" })],
    });
    render(<FeedPostDetailPage />);

    expect(screen.queryByText(/일차 ·/)).toBeNull();
    expect(screen.getAllByTestId("route-map")).toHaveLength(1);
  });

  it("같은 유형 표시는 남의 글에만 붙는다", () => {
    showPost({ isMine: false, sameTypeMatch: true });
    const { unmount } = render(<FeedPostDetailPage />);
    expect(screen.getByText("같은 유형")).toBeTruthy();
    unmount();

    showPost({ isMine: true, sameTypeMatch: true });
    render(<FeedPostDetailPage />);
    expect(screen.queryByText("같은 유형")).toBeNull();
  });

  it("남의 글에는 수정·삭제 버튼이 없다", () => {
    showPost({ isMine: false });
    render(<FeedPostDetailPage />);

    expect(screen.queryByRole("button", { name: "수정" })).toBeNull();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
  });
});

describe("게시물 상세 — 내 글 수정", () => {
  beforeEach(() => {
    showPost({ isMine: true, caption: "원래 이름", text: "원래 소개" });
  });

  it("코스 이름을 비우면 저장하지 않고 안내한다", async () => {
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);

    await user.click(screen.getByRole("button", { name: "수정" }));
    const caption = screen.getByLabelText("코스 이름") as HTMLInputElement;
    expect(caption.value).toBe("원래 이름");
    expect((screen.getByLabelText("코스 소개") as HTMLTextAreaElement).value).toBe("원래 소개");
    // 수정 중에는 상단 버튼을 감춘다.
    expect(screen.queryByRole("button", { name: "수정" })).toBeNull();

    await user.clear(caption);
    await user.type(caption, "   ");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(useToastStore.getState().message).toBe("코스 이름을 입력해주세요");
    expect(hooks.updateAsync).not.toHaveBeenCalled();
  });

  it("앞뒤 공백을 걷어 저장하고 폼을 닫는다", async () => {
    hooks.updateAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);

    await user.click(screen.getByRole("button", { name: "수정" }));
    const caption = screen.getByLabelText("코스 이름");
    const text = screen.getByLabelText("코스 소개");
    await user.clear(caption);
    await user.type(caption, "  새 이름 ");
    await user.clear(text);
    await user.type(text, "새 소개  ");
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(useToastStore.getState().message).toBe("수정했어요"));
    expect(hooks.updateAsync).toHaveBeenCalledWith({
      postId: "post-1",
      input: { caption: "새 이름", text: "새 소개" },
    });
    expect(screen.queryByLabelText("코스 이름")).toBeNull();
  });

  it("저장에 실패하면 에러 문구를 띄우고 폼을 유지한다", async () => {
    hooks.updateAsync.mockRejectedValue(new Error("게시물을 수정하지 못했어요"));
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);

    await user.click(screen.getByRole("button", { name: "수정" }));
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(useToastStore.getState().message).toBe("게시물을 수정하지 못했어요"));
    expect(screen.getByLabelText("코스 이름")).toBeTruthy();
  });

  it("취소하면 저장하지 않고 원래 화면으로 돌아간다", async () => {
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);

    await user.click(screen.getByRole("button", { name: "수정" }));
    // 수정 폼의 취소가 삭제 모달의 취소보다 DOM에서 앞에 있다.
    await user.click(screen.getAllByRole("button", { name: "취소" })[0]);

    expect(screen.queryByLabelText("코스 이름")).toBeNull();
    expect(screen.getByRole("heading", { name: "원래 이름" })).toBeTruthy();
    expect(hooks.updateAsync).not.toHaveBeenCalled();
  });
});

describe("게시물 상세 — 내 글 삭제", () => {
  beforeEach(() => {
    showPost({ isMine: true });
  });

  it("확인 모달을 거쳐 삭제하고, 히스토리를 갈아끼워 둘러보기로 보낸다", async () => {
    hooks.deleteAsync.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);
    expect(modalOpen("이 글을 삭제할까요?")).toBe(false);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(modalOpen("이 글을 삭제할까요?")).toBe(true);

    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/feed"));
    expect(hooks.deleteAsync).toHaveBeenCalledWith("post-1");
    expect(useToastStore.getState().message).toBe("내 글을 삭제했어요");
  });

  it("삭제에 실패하면 알리고 머문다", async () => {
    hooks.deleteAsync.mockRejectedValue(new Error("fail"));
    const user = userEvent.setup();
    render(<FeedPostDetailPage />);

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("삭제하지 못했어요. 잠시 후 다시 시도해주세요")
    );
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
