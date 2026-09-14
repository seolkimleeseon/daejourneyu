import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StopThumbnail } from "@/components/course/StopThumbnail";

describe("StopThumbnail", () => {
  it("사진이 있으면 사진을 보여준다", () => {
    const { container } = render(
      <StopThumbnail category="산책" imageUrl="https://img/place.jpg" />
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://img/place.jpg");
  });

  it("사진이 없으면 카테고리 이모지로 대체한다", () => {
    const { container } = render(<StopThumbnail category="맛집" />);

    expect(container.querySelector("img[src^='https']")).toBeNull();
    expect(container.innerHTML).toContain("bg-accent-amber-light");
  });

  it("외부 이미지가 깨지면 조용히 이모지 카드로 바꾼다", () => {
    const { container } = render(
      <StopThumbnail category="산책" imageUrl="https://img/expired.jpg" />
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img[src='https://img/expired.jpg']")).toBeNull();
    expect(container.innerHTML).toContain("bg-brand-100");
  });

  it("장식용 이미지라 alt는 비운다", () => {
    const { container } = render(<StopThumbnail category="산책" imageUrl="https://img/a.jpg" />);

    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("원본 서버로 유입 경로를 흘리지 않는다", () => {
    const { container } = render(<StopThumbnail category="산책" imageUrl="https://img/a.jpg" />);

    expect(container.querySelector("img")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("순번 뱃지는 요청했을 때만 붙인다", () => {
    const { unmount } = render(<StopThumbnail category="산책" />);
    expect(screen.queryByText("1")).toBeNull();
    unmount();

    render(<StopThumbnail category="산책" badge={3} />);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("첫 번째 뱃지(0)도 감추지 않는다", () => {
    render(<StopThumbnail category="산책" badge={0} />);

    expect(screen.getByText("0")).toBeTruthy();
  });

  it("크기를 지정하면 그 크기로 그린다", () => {
    const { container } = render(<StopThumbnail category="산책" size={80} />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("80px");
    expect(wrapper.style.height).toBe("80px");
  });
});
