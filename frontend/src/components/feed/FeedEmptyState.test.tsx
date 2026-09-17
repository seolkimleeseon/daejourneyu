import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { icon3D } from "@/test/icon3d";

describe("FeedEmptyState", () => {
  it("이모지·제목·안내 문구를 보여준다", () => {
    render(<FeedEmptyState emoji="🧭" title="아직 코스가 없어요" description="첫 코스를 자랑해보세요" />);

    expect(icon3D("compass_3d.png")).toBeTruthy();
    expect(screen.getByText("아직 코스가 없어요")).toBeTruthy();
    expect(screen.getByText("첫 코스를 자랑해보세요")).toBeTruthy();
  });
});
