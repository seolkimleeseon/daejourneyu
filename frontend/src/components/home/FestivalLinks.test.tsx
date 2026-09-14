import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FestivalLinks } from "@/components/home/FestivalLinks";

describe("FestivalLinks", () => {
  it("링크가 하나도 없으면 자리를 차지하지 않는다", () => {
    const { container } = render(
      <FestivalLinks festival={{ webUrl: undefined, instagramUrl: undefined }} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("홈페이지 링크를 새 탭으로 연다", () => {
    render(<FestivalLinks festival={{ webUrl: "https://festival.example.com" }} />);

    const link = screen.getByRole("link", { name: "블로그·홈페이지에서 보기" });
    expect(link.getAttribute("href")).toBe("https://festival.example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    // 외부 사이트에 우리 탭 제어권을 넘기지 않는다.
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("인스타그램 링크도 같은 방식으로 연다", () => {
    render(<FestivalLinks festival={{ instagramUrl: "https://instagram.com/daejeon" }} />);

    expect(screen.getByRole("link", { name: "인스타그램에서 보기" })).toBeTruthy();
  });

  it("있는 링크만 보여준다", () => {
    render(<FestivalLinks festival={{ webUrl: "https://festival.example.com" }} />);

    expect(screen.queryByRole("link", { name: "인스타그램에서 보기" })).toBeNull();
  });

  it("둘 다 있으면 둘 다 보여준다", () => {
    render(
      <FestivalLinks
        festival={{ webUrl: "https://a.example.com", instagramUrl: "https://b.example.com" }}
      />
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("카드 클릭으로 전파하지 않는다 — 카드는 장소로 이동한다", async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    render(
      <div onClick={onCardClick}>
        <FestivalLinks festival={{ webUrl: "https://festival.example.com" }} />
      </div>
    );

    await user.click(screen.getByRole("link", { name: "블로그·홈페이지에서 보기" }));

    expect(onCardClick).not.toHaveBeenCalled();
  });
});
