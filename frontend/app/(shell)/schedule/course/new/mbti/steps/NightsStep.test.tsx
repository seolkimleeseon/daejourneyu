import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NightsStep } from "./NightsStep";

const onChangeNights = vi.fn();
const onNext = vi.fn();

function setup(props: Partial<React.ComponentProps<typeof NightsStep>> = {}) {
  const view = render(
    <NightsStep
      theme="산책"
      nights={0}
      onChangeNights={onChangeNights}
      onNext={onNext}
      {...props}
    />
  );
  return { ...view, user: userEvent.setup() };
}

/** 가운데 크게 적힌 현재 값 — 빠른 선택 칩에도 같은 문구가 있어 자리로 구분한다. */
function current(container: HTMLElement): string {
  return container.querySelector(".text-base.font-bold.text-brand-700")!.textContent ?? "";
}

const minus = () => screen.getByRole("button", { name: "−" });
const plus = () => screen.getByRole("button", { name: "＋" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("테스트 결과 잇기", () => {
  it("앞 단계에서 나온 테마를 다시 알려준다 — 무엇을 기준으로 짜는지 보이게", () => {
    setup({ theme: "맛집" });

    expect(screen.getByText("맛집형 코스로 추천해드려요")).toBeTruthy();
  });

  it("출발 날짜는 지금 안 정해도 된다고 알린다", () => {
    const { container } = setup();

    expect(container.textContent).toContain("출발 날짜는 지금 안 정해도 돼요");
  });
});

describe("박 수 고르기", () => {
  it("0박은 당일치기로 읽어준다", () => {
    const { container } = setup();

    expect(current(container)).toBe("당일치기");
  });

  it("＋와 −로 하루씩 옮긴다", async () => {
    const { user } = setup({ nights: 2 });

    await user.click(plus());
    expect(onChangeNights).toHaveBeenCalledWith(3);

    await user.click(minus());
    expect(onChangeNights).toHaveBeenLastCalledWith(1);
  });

  it("당일치기에서 더 줄일 수 없다", () => {
    setup({ nights: 0 });

    expect(minus().hasAttribute("disabled")).toBe(true);
  });

  it("4박이 상한이다 — 그 위로는 못 올린다", () => {
    setup({ nights: 4 });

    expect(plus().hasAttribute("disabled")).toBe(true);
    expect(minus().hasAttribute("disabled")).toBe(false);
  });

  it("칩을 누르면 그 값으로 곧장 간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "1박 2일" }));

    expect(onChangeNights).toHaveBeenCalledWith(1);
  });

  it("지금 고른 값의 칩만 강조한다", () => {
    setup({ nights: 2 });

    expect(screen.getByRole("button", { name: "2박 3일" }).className).toContain("bg-brand text-white");
    expect(screen.getByRole("button", { name: "당일치기" }).className).not.toContain("bg-brand text-white");
  });
});

describe("다음", () => {
  it("코스 생성으로 넘어간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
