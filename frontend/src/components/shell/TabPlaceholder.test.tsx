import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

describe("TabPlaceholder", () => {
  it("이모지와 안내 문구를 보여준다", () => {
    render(<TabPlaceholder emoji="🚧" message="곧 채워질 화면이에요" />);

    expect(screen.getByText("🚧")).toBeTruthy();
    expect(screen.getByText("곧 채워질 화면이에요")).toBeTruthy();
  });
});
