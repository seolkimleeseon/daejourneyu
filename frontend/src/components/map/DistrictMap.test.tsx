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

/** 지도 위 구별 히트스팟 버튼(접근성 라벨 "OO구 선택")만 골라낸다 — 아래 확인 버튼과 섞이지 않게. */
function hotspotButton(district: string) {
  return screen.getByRole("button", { name: `${district} 선택` });
}

describe("DistrictMap", () => {
  it("서비스 범위인 5개 구를 모두 둔다", () => {
    setup();

    DISTRICTS.forEach((district) => expect(hotspotButton(district)).toBeTruthy());
  });

  it("아무 구도 안 골랐을 때도 확인 버튼은 미리 자리를 잡고 있다 — 다만 눌러도 아무 일도 없다", async () => {
    const { user, onSelect } = setup();

    const button = screen.getByRole("button", { name: "구를 선택해 주세요" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("구를 누른 것만으로는 이동하지 않는다 — 골랐다는 걸 보여준 뒤 확인 버튼을 또 눌러야 한다", async () => {
    const { user, onSelect } = setup();

    await user.click(hotspotButton("유성구"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "유성구 둘러보기" })).toBeTruthy();
  });

  it("고른 뒤 확인 버튼을 누르면 그 구 이름을 올려보낸다", async () => {
    const { user, onSelect } = setup();

    await user.click(hotspotButton("유성구"));
    await user.click(screen.getByRole("button", { name: "유성구 둘러보기" }));

    expect(onSelect).toHaveBeenCalledWith("유성구");
  });

  it("다른 구를 고르면 확인 버튼도 새로 고른 구를 따라간다", async () => {
    const { user } = setup();

    await user.click(hotspotButton("유성구"));
    await user.click(hotspotButton("동구"));

    expect(screen.getByRole("button", { name: "동구 둘러보기" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "유성구 둘러보기" })).toBeNull();
  });

  it("구마다 다른 이미지를 써서 지도처럼 구분된다", () => {
    const { container } = setup();

    const srcs = Array.from(container.querySelectorAll<HTMLImageElement>("img")).map((img) => img.src);
    // 평면 지도 1장 + 구별 팝업 이미지 5장 = 6장 전부 서로 다른 파일이어야 한다.
    expect(new Set(srcs).size).toBe(6);
  });

  it("구마다 제자리를 차지한다 — 히트스팟이 겹치면 지도 모양이 깨진다", () => {
    setup();

    const positions = DISTRICTS.map((district) => {
      const button = hotspotButton(district);
      return `${button.style.left},${button.style.top}`;
    });
    expect(new Set(positions).size).toBe(DISTRICTS.length);
  });
});
