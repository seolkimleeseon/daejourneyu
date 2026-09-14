import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tag } from "@/components/ui/Tag";

describe("Tag", () => {
  it("기본은 neutral — 테두리 있는 회색 칩", () => {
    render(<Tag>서구</Tag>);

    const className = screen.getByRole("button", { name: "서구" }).className;
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

    expect(screen.getByRole("button").className).toContain(expected);
  });

  it("neutral-ghost는 테두리가 없다 — 필터 칩이 줄줄이 늘어설 때 시끄럽지 않게", () => {
    render(<Tag tone="neutral-ghost">맛집</Tag>);

    expect(screen.getByRole("button").className).not.toContain("border-line-strong");
  });

  it("active면 톤과 무관하게 선택된 칩으로 칠한다", () => {
    render(
      <Tag tone="amber" active>
        선택됨
      </Tag>
    );

    const className = screen.getByRole("button").className;
    expect(className).toContain("bg-brand");
    expect(className).toContain("text-white");
  });

  it("기본 type은 button — 폼 안에서 제출로 새지 않는다", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Tag>소형견</Tag>
      </form>
    );

    await user.click(screen.getByRole("button", { name: "소형견" }));

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
