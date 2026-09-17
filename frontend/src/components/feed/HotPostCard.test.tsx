import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HotPostCard } from "@/components/feed/HotPostCard";
import { makePost, makeStop } from "@/test/fixtures";

describe("HotPostCard", () => {
  it("가장 많이 담긴 코스의 요약을 보여주고 게시물 상세로 연결한다", () => {
    const year = new Date().getFullYear();
    const post = makePost({
      id: "hot-1",
      caption: "대청호 한 바퀴",
      authorName: "두부네",
      saves: 42,
      stops: [makeStop({ placeId: "a" }), makeStop({ placeId: "b" }), makeStop({ placeId: "c" })],
      createdAt: `${year}-08-12T09:00:00.000Z`,
    });

    const { container } = render(<HotPostCard post={post} />);

    expect(screen.getByText("지금 가장 많이 담아갔어요")).toBeTruthy();
    expect(screen.getByText("대청호 한 바퀴")).toBeTruthy();
    expect(screen.getByText("42명이 담아감")).toBeTruthy();
    expect(container.textContent).toContain("두부네 · 3곳");
    expect(screen.getByText("8월 12일")).toBeTruthy();
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/feed/post/hot-1");
  });
});
