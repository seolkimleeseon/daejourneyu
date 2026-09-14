import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TraitChip } from "@/components/mbti/TraitChip";

describe("TraitChip", () => {
  it("성향 문구를 그대로 보여준다", () => {
    render(<TraitChip label="인싸력 갑" />);

    expect(screen.getByText("인싸력 갑")).toBeTruthy();
  });

  it("MBTI 결과 계열 색(보라)을 쓴다 — 다른 칩과 섞이지 않게", () => {
    render(<TraitChip label="활발함" />);

    expect(screen.getByText("활발함").className).toContain("text-accent-purple");
  });
});
