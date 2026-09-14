import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TravelingDog } from "@/components/map/TravelingDog";

describe("TravelingDog", () => {
  it("어디로 가는 중인지 알려준다", () => {
    render(<TravelingDog destination="유성구" />);

    expect(screen.getByText("유성구")).toBeTruthy();
    expect(screen.getByText(/달려가는 중…/)).toBeTruthy();
  });

  it("강아지는 그림으로 읽히게 이름을 붙인다", () => {
    render(<TravelingDog destination="중구" />);

    expect(screen.getByRole("img", { name: "달려가는 강아지" })).toBeTruthy();
  });

  it("강아지와 점선길이 같은 궤적을 공유한다 — 길 밖으로 달리면 안 된다", () => {
    const { container } = render(<TravelingDog destination="서구" />);

    const trail = container.querySelector("path[stroke-dasharray]")!.getAttribute("d");
    const runner = container.querySelector("[style*='offset-path']") as HTMLElement;

    expect(trail).toBeTruthy();
    expect(runner.style.offsetPath).toContain(trail!);
  });

  it("장식용 길과 핀은 스크린리더가 읽지 않는다", () => {
    const { container } = render(<TravelingDog destination="동구" />);

    expect(container.querySelector("svg[aria-hidden]")).toBeTruthy();
  });
});
