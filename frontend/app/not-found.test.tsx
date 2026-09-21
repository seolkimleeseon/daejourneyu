import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("404 화면", () => {
  it("한국어로 안내하고 홈으로 돌아가는 링크를 준다", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "홈으로 가기" }).getAttribute("href")).toBe("/home");
  });
});
