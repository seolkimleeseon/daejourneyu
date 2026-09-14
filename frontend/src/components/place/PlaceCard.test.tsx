import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlaceCard } from "@/components/place/PlaceCard";
import { makePlace } from "@/test/fixtures";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PlaceCard", () => {
  it("이름과 자치구를 보여준다", () => {
    render(<PlaceCard place={makePlace({ name: "한밭수목원", district: "서구" })} />);

    expect(screen.getByText("한밭수목원")).toBeTruthy();
    expect(screen.getByText(/서구/)).toBeTruthy();
  });

  it("누르면 장소 상세로 보낸다", async () => {
    const user = userEvent.setup();
    render(<PlaceCard place={makePlace({ name: "한밭수목원" })} />);

    await user.click(screen.getByRole("button"));

    expect(nav.push).toHaveBeenCalledWith("/place/%ED%95%9C%EB%B0%AD%EC%88%98%EB%AA%A9%EC%9B%90");
  });

  it("이름에 슬래시가 있어도 경로가 깨지지 않는다", async () => {
    const user = userEvent.setup();
    render(<PlaceCard place={makePlace({ name: "카페 A/B" })} />);

    await user.click(screen.getByRole("button"));

    expect(nav.push).toHaveBeenCalledWith("/place/%EC%B9%B4%ED%8E%98%20A%2FB");
  });

  it("사진이 있으면 사진을 쓴다", () => {
    const { container } = render(
      <PlaceCard place={{ ...makePlace(), imageUrl: "https://img/a.jpg" }} />
    );

    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://img/a.jpg");
  });

  it("사진이 깨지면 카테고리 이모지로 조용히 바꾼다", () => {
    const { container } = render(
      <PlaceCard place={{ ...makePlace({ category: "맛집" }), imageUrl: "https://img/dead.jpg" }} />
    );

    fireEvent.error(container.querySelector("img")!);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getAllByText("🍔").length).toBeGreaterThan(0);
  });

  it("카테고리 배지를 붙인다", () => {
    render(<PlaceCard place={makePlace({ category: "산책" })} />);

    expect(screen.getByText(/🌳 산책/)).toBeTruthy();
  });

  it("동반 불가인 곳은 눈에 띄게 알린다", () => {
    render(<PlaceCard place={makePlace({ petFriendly: false })} />);

    expect(screen.getByText("🚫 동반 불가")).toBeTruthy();
  });

  it("동반 가능한 곳에는 그 배지를 달지 않는다", () => {
    render(<PlaceCard place={makePlace({ petFriendly: true })} />);

    expect(screen.queryByText("🚫 동반 불가")).toBeNull();
  });

  it("조건 칩을 함께 보여준다", () => {
    render(<PlaceCard place={makePlace({ condition: "전 견종 · 목줄 필수" })} />);

    expect(screen.getByText("목줄 필수")).toBeTruthy();
    expect(screen.getByText("전 견종 가능")).toBeTruthy();
  });

  it("smallDogOnly면 칩으로 보강한다", () => {
    render(
      <PlaceCard place={makePlace({ condition: "10kg 미만 동반 가능", smallDogOnly: true })} />
    );

    expect(screen.getByText("소형견만")).toBeTruthy();
  });

  it("칩이 없어도 그 줄의 높이는 유지한다 — 2열 그리드에서 카드 높이가 어긋나면 안 된다", () => {
    const { container } = render(
      <PlaceCard place={makePlace({ condition: "대전관광공사 반려동물 동반시설 인증" })} />
    );

    const tagRow = container.querySelector(".h-5");
    expect(tagRow).toBeTruthy();
    expect(tagRow?.children).toHaveLength(0);
  });
});
