import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DistrictMap } from "@/components/map/DistrictMap";
import { DISTRICTS } from "@/lib/placeFilters";

function setup() {
  const onSelect = vi.fn();
  const view = render(<DistrictMap onSelect={onSelect} />);
  return { ...view, onSelect, user: userEvent.setup() };
}

describe("DistrictMap", () => {
  it("서비스 범위인 5개 구를 모두 둔다", () => {
    setup();

    expect(screen.getAllByRole("button")).toHaveLength(5);
    DISTRICTS.forEach((district) => expect(screen.getByText(district)).toBeTruthy());
  });

  it("구를 누르면 그 이름을 올려보낸다", async () => {
    const { user, onSelect } = setup();

    await user.click(screen.getByText("유성구"));

    expect(onSelect).toHaveBeenCalledWith("유성구");
  });

  it("구마다 다른 색을 써서 지도처럼 구분된다", () => {
    const { container } = setup();

    const tones = Array.from(container.querySelectorAll("button")).map(
      (button) => button.className.match(/bg-[\w-]+/)?.[0]
    );
    expect(new Set(tones).size).toBe(5);
  });

  it("실좌표 대신 구의 상대 위치를 배치로 본뜬다", () => {
    const { container } = setup();

    // 유성·대덕이 위 두 줄, 서·중·동이 아래 한 줄.
    const areas = (container.firstElementChild as HTMLElement).style.gridTemplateAreas;
    expect(areas).toContain("seo jung dong dong");
  });

  it("구마다 제자리를 차지한다 — 겹치면 지도 모양이 깨진다", () => {
    const { container } = setup();

    const placed = Array.from(container.querySelectorAll("button")).map(
      (button) => (button as HTMLElement).style.gridArea
    );
    expect(new Set(placed).size).toBe(5);
  });
});
