import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Emoji3D } from "@/components/ui/Emoji3D";

/** 3D 아이콘이 준비된 이모지 하나와, 표에 없는 이모지 하나. */
const MAPPED = "🐾";
const UNMAPPED = "🦖";

describe("Emoji3D", () => {
  it("표에 있는 이모지는 3D 이미지로 바꾼다", () => {
    const { container } = render(<Emoji3D emoji={MAPPED} />);

    const image = container.querySelector("img");
    expect(image).toBeTruthy();
    expect(image?.getAttribute("src")).toContain("paw_prints_3d");
  });

  it("장식용이라 alt는 비워 스크린리더가 읽지 않게 한다", () => {
    const { container } = render(<Emoji3D emoji={MAPPED} />);

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("표에 없는 이모지는 원래 문자를 그대로 보여준다 — 빈 칸이 생기면 안 된다", () => {
    const { container } = render(<Emoji3D emoji={UNMAPPED} />);

    expect(screen.getByText(UNMAPPED)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("크기를 지정하면 그 크기로 그린다", () => {
    const { container } = render(<Emoji3D emoji={MAPPED} size={42} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("42px");
    expect(wrapper.style.height).toBe("42px");
  });

  it("문자 대체일 때도 크기에 맞춰 글자를 키운다", () => {
    render(<Emoji3D emoji={UNMAPPED} size={40} />);

    expect((screen.getByText(UNMAPPED) as HTMLElement).style.fontSize).toBe("30px");
  });

  it("glow는 요청했을 때만 깔고, 스크린리더에서는 감춘다", () => {
    const { container, unmount } = render(<Emoji3D emoji={MAPPED} />);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
    unmount();

    const { container: glowing } = render(
      <Emoji3D emoji={MAPPED} glowClassName="bg-brand-300" />
    );
    const glow = glowing.querySelector("[aria-hidden]");
    expect(glow?.className).toContain("bg-brand-300");
  });

  it("접지 그림자는 기본으로 켜고 끌 수도 있다", () => {
    const { container, unmount } = render(<Emoji3D emoji={MAPPED} />);
    expect(container.querySelector("img")?.className).toContain("drop-shadow");
    unmount();

    const { container: flat } = render(<Emoji3D emoji={MAPPED} shadow={false} />);
    expect(flat.querySelector("img")?.className).not.toContain("drop-shadow");
  });
});
