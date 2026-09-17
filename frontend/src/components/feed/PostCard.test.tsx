import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostCard } from "@/components/feed/PostCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { makePost, makeStop } from "@/test/fixtures";

const hooks = vi.hoisted(() => ({ useToggleSave: vi.fn() }));
vi.mock("@/hooks/usePosts", () => ({ useToggleSave: hooks.useToggleSave }));

beforeEach(() => {
  hooks.useToggleSave.mockReturnValue({ mutate: vi.fn(), isPending: false });
  useAuthStore.setState({ isLoggedIn: false, hydrated: true, user: null });
});

describe("PostCard", () => {
  it("작성자·제목·소개와 등록일을 보여주고 카드 전체가 상세로 가는 링크다", () => {
    const post = makePost({
      id: "p1",
      authorName: "콩이네",
      caption: "갑천 산책 코스",
      text: "그늘이 많아요",
      createdAt: `${new Date().getFullYear()}-08-12T09:00:00.000Z`,
    });

    const { container } = render(<PostCard post={post} />);

    expect(screen.getByText("콩이네")).toBeTruthy();
    expect(screen.getByText("갑천 산책 코스")).toBeTruthy();
    expect(screen.getByText("그늘이 많아요")).toBeTruthy();
    expect(screen.getByText("8월 12일")).toBeTruthy();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/feed/post/p1");
  });

  it("경유지는 세 곳까지만 펼치고 나머지는 '외 N곳'으로 접는다", () => {
    const stops = ["첫째", "둘째", "셋째", "넷째", "다섯째"].map((name, index) =>
      makeStop({ placeId: `s${index}`, name })
    );

    render(<PostCard post={makePost({ stops })} />);

    expect(screen.getByText("첫째")).toBeTruthy();
    expect(screen.getByText("셋째")).toBeTruthy();
    expect(screen.queryByText("넷째")).toBeNull();
    expect(screen.getByText("외 2곳")).toBeTruthy();
  });

  it("경유지가 세 곳 이하면 접지 않는다", () => {
    render(<PostCard post={makePost({ stops: [makeStop()] })} />);

    expect(screen.queryByText(/외 \d+곳/)).toBeNull();
  });

  it("일정 길이·자치구 태그만 보여준다", () => {
    render(<PostCard post={makePost({ tags: ["당일치기", "자차", "유성구"] })} />);

    expect(screen.getByText("당일치기")).toBeTruthy();
    expect(screen.getByText("유성구")).toBeTruthy();
    expect(screen.queryByText("자차")).toBeNull();
  });

  it("내 글이면 '내 글' 표시를, 남의 글이면서 유형이 같을 때만 '같은 유형' 표시를 단다", () => {
    const { rerender } = render(<PostCard post={makePost({ isMine: false, sameTypeMatch: true })} />);
    expect(screen.getByText("같은 유형")).toBeTruthy();
    expect(screen.queryByText("내 글")).toBeNull();

    rerender(<PostCard post={makePost({ isMine: true, sameTypeMatch: true })} />);
    expect(screen.getByText("내 글")).toBeTruthy();
    expect(screen.queryByText("같은 유형")).toBeNull();
  });

  it("하단 줄에 담긴 수를 보여준다", () => {
    render(<PostCard post={makePost({ saves: 12 })} />);

    expect(screen.getByText("12명이 담아감")).toBeTruthy();
  });
});
