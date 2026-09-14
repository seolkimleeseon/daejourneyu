import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppIcon } from "@/components/shell/AppIcon";

describe("AppIcon", () => {
  it("서비스 이름을 읽어주는 그림으로 둔다", () => {
    render(<AppIcon />);

    expect(screen.getByRole("img", { name: "대저니유" })).toBeTruthy();
  });

  it("크기를 지정할 수 있고 기본값이 있다", () => {
    const { unmount } = render(<AppIcon />);
    expect(screen.getByRole("img").getAttribute("width")).toBe("40");
    unmount();

    render(<AppIcon size={72} />);
    expect(screen.getByRole("img").getAttribute("width")).toBe("72");
    expect(screen.getByRole("img").getAttribute("height")).toBe("72");
  });

  it("크기를 키워도 viewBox는 그대로라 모양이 찌그러지지 않는다", () => {
    render(<AppIcon size={120} />);

    expect(screen.getByRole("img").getAttribute("viewBox")).toBe("0 0 40 40");
  });

  it("inverted는 브랜드 배경 위에서 쓰는 반전 스킨이다", () => {
    const { container, unmount } = render(<AppIcon />);
    const solid = container.innerHTML;
    unmount();

    const { container: invertedContainer } = render(<AppIcon variant="inverted" />);

    expect(invertedContainer.innerHTML).not.toBe(solid);
  });

  it("넘긴 className을 그대로 붙인다", () => {
    render(<AppIcon className="rounded-2xl shadow-lg" />);

    expect(screen.getByRole("img").getAttribute("class")).toBe("rounded-2xl shadow-lg");
  });
});
