import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "@/components/ui/Tag";

describe("Tag", () => {
  it("기본은 neutral — 테두리 있는 회색 칩", () => {
    render(<Tag>서구</Tag>);

    const className = screen.getByText("서구").className;
    expect(className).toContain("border-line-strong");
    expect(className).toContain("text-ink-muted");
  });

  it.each([
    ["brand", "bg-brand-100"],
    ["purple", "text-accent-purple"],
    ["amber", "text-accent-amber"],
    ["coral", "text-accent-coral"],
    ["neutral-ghost", "bg-surface"],
  ] as const)("%s 톤을 쓴다", (tone, expected) => {
    render(<Tag tone={tone}>태그</Tag>);

    expect(screen.getByText("태그").className).toContain(expected);
  });

  it("neutral-ghost는 테두리가 없다 — 필터 칩이 줄줄이 늘어설 때 시끄럽지 않게", () => {
    render(<Tag tone="neutral-ghost">맛집</Tag>);

    expect(screen.getByText("맛집").className).not.toContain("border-line-strong");
  });

  it("active면 톤과 무관하게 선택된 칩으로 칠한다", () => {
    render(
      <Tag tone="amber" active>
        선택됨
      </Tag>
    );

    const className = screen.getByText("선택됨").className;
    expect(className).toContain("bg-brand");
    expect(className).toContain("text-white");
  });

  it("누를 곳이 없으면 버튼이 아니라 글자로 그린다 — 키보드 포커스만 먹는 장식이 되지 않게", () => {
    render(<Tag>소형견</Tag>);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("소형견").tagName).toBe("SPAN");
  });

  it("클릭 핸들러가 있으면 버튼이고, 기본 type은 button — 폼 안에서 제출로 새지 않는다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Tag onClick={vi.fn()}>소형견</Tag>
      </form>
    );

    const button = screen.getByRole("button", { name: "소형견" });
    await user.click(button);

    expect(button.getAttribute("type")).toBe("button");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("클릭 핸들러와 나머지 속성을 넘긴다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Tag onClick={onClick} aria-label="자치구 필터">
        서구
      </Tag>
    );

    await user.click(screen.getByRole("button", { name: "자치구 필터" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
