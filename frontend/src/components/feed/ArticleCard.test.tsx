import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { makeArticle, makeUser } from "@/test/fixtures";

beforeEach(() => {
  useFeedStore.setState({ overrides: {}, articleLikes: {} });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: makeUser() });
});

describe("ArticleCard", () => {
  it("제목·요약·날짜·조회수를 보여주고 아티클 상세로 연결한다", () => {
    const article = makeArticle({
      id: "a1",
      title: "산책로 모음",
      summary: "그늘 많은 곳",
      date: "2026-08-02",
      views: 1234,
    });

    const { container } = render(<ArticleCard article={article} />);

    expect(screen.getByText("📰 산책로 모음")).toBeTruthy();
    expect(screen.getByText("그늘 많은 곳")).toBeTruthy();
    expect(screen.getByText("8월 2일")).toBeTruthy();
    expect(screen.getByText(`조회 ${(1234).toLocaleString()}`)).toBeTruthy();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/article/a1");
  });

  it("좋아요를 누르면 수와 상태가 바뀌고 스토어에 기록된다", async () => {
    const user = userEvent.setup();
    render(<ArticleCard article={makeArticle({ id: "a1", likes: 5, liked: false })} />);
    const button = screen.getByRole("button");

    expect(button.textContent).toBe("♡ 5");
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await user.click(button);
    expect(button.textContent).toBe("❤ 6");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(useFeedStore.getState().articleLikes).toEqual({ a1: true });

    await user.click(button);
    expect(button.textContent).toBe("♡ 5");
  });

  it("비로그인 상태에서는 좋아요를 기록하지 않고 로그인부터 안내한다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: true, user: null });
    const onRequireLogin = vi.fn();
    render(
      <ArticleCard
        article={makeArticle({ id: "a1", likes: 5, liked: false })}
        onRequireLogin={onRequireLogin}
      />
    );

    await userEvent.setup().click(screen.getByRole("button"));

    expect(onRequireLogin).toHaveBeenCalledTimes(1);
    expect(useFeedStore.getState().articleLikes).toEqual({});
  });

  it("세션 복구 전에는 아무 판단도 하지 않는다 — 로그인 사용자를 막으면 안 된다", async () => {
    useAuthStore.setState({ isLoggedIn: false, hydrated: false, user: null });
    const onRequireLogin = vi.fn();
    render(
      <ArticleCard
        article={makeArticle({ id: "a1", likes: 5, liked: false })}
        onRequireLogin={onRequireLogin}
      />
    );

    await userEvent.setup().click(screen.getByRole("button"));

    expect(onRequireLogin).not.toHaveBeenCalled();
    expect(useFeedStore.getState().articleLikes).toEqual({});
  });
});
