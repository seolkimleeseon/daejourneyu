import { describe, expect, it, vi } from "vitest";
import CourseSharePage from "./page";

const nav = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: nav.redirect }));

describe("코스 공유 진입점", () => {
  it("게시물을 만드는 화면(FEED)으로 코스를 실어 넘긴다", () => {
    CourseSharePage({ params: { courseId: "course-1" } });

    expect(nav.redirect).toHaveBeenCalledWith("/feed/share?courseId=course-1");
  });

  it("id에 특수문자가 섞여도 깨지지 않게 감싼다", () => {
    CourseSharePage({ params: { courseId: "코스/1&2" } });

    expect(nav.redirect).toHaveBeenLastCalledWith("/feed/share?courseId=%EC%BD%94%EC%8A%A4%2F1%262");
  });
});
