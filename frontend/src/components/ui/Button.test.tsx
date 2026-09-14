import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("기본은 primary — 변형을 안 주면 브랜드 색으로 그린다", () => {
    render(<Button>등록하기</Button>);

    expect(screen.getByRole("button", { name: "등록하기" }).className).toContain("bg-brand");
  });

  it.each([
    ["primary", "bg-brand"],
    ["secondary", "border-line-strong"],
    ["text", "bg-transparent"],
  ] as const)("%s 변형은 제 스킨을 쓴다", (variant, expected) => {
    render(<Button variant={variant}>버튼</Button>);

    expect(screen.getByRole("button").className).toContain(expected);
  });

  it("text 변형만 높이를 낮추고 굵기를 줄인다 — 보조 동작이라 주 버튼과 구분된다", () => {
    const { unmount } = render(<Button variant="text">나중에</Button>);
    const text = screen.getByRole("button").className;
    unmount();

    render(<Button variant="primary">지금</Button>);
    const primary = screen.getByRole("button").className;

    expect(text).toContain("min-h-10");
    expect(text).toContain("font-normal");
    expect(primary).toContain("min-h-12");
    expect(primary).toContain("font-bold");
  });

  it("넘긴 className이 기본 클래스를 이긴다 — 충돌 클래스는 twMerge가 정리한다", () => {
    render(<Button className="bg-accent-coral">삭제</Button>);

    const className = screen.getByRole("button").className;
    expect(className).toContain("bg-accent-coral");
    expect(className).not.toContain("bg-brand ");
  });

  it("disabled면 눌러도 콜백이 돌지 않는다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        저장 중…
      </Button>
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("나머지 속성은 버튼에 그대로 넘긴다", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button type="submit" aria-label="저장" onClick={onClick}>
        저장
      </Button>
    );

    const button = screen.getByRole("button", { name: "저장" });
    expect(button.getAttribute("type")).toBe("submit");

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
