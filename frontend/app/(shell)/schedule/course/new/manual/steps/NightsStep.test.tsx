import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NightsStep } from "./NightsStep";

const onChangeNights = vi.fn();
const onNext = vi.fn();

function setup(nights = 0) {
  const view = render(
    <NightsStep nights={nights} onChangeNights={onChangeNights} onNext={onNext} />
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

describe("박 수 고르기", () => {
  it("0박은 당일치기로 읽어준다 — 숫자 0을 그대로 보여주지 않는다", () => {
    const { container } = setup(0);

    expect(current(container)).toBe("당일치기");
  });

  it("1박이면 1박 2일로 읽어준다", () => {
    const { container } = setup(1);

    expect(current(container)).toBe("1박 2일");
  });

  it("＋로 하루 늘린다", async () => {
    const { user } = setup(1);

    await user.click(plus());

    expect(onChangeNights).toHaveBeenCalledWith(2);
  });

  it("−로 하루 줄인다", async () => {
    const { user } = setup(2);

    await user.click(minus());

    expect(onChangeNights).toHaveBeenCalledWith(1);
  });

  it("당일치기에서 더 줄일 수 없다", () => {
    setup(0);

    expect(minus().hasAttribute("disabled")).toBe(true);
  });

  it("4박이 상한이다 — 그 위로는 못 올린다", () => {
    setup(4);

    expect(plus().hasAttribute("disabled")).toBe(true);
    expect(minus().hasAttribute("disabled")).toBe(false);
  });
});

describe("빠른 선택", () => {
  it("자주 고르는 세 가지를 칩으로 둔다", () => {
    setup();

    expect(screen.getByRole("button", { name: "당일치기" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1박 2일" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2박 3일" })).toBeTruthy();
  });

  it("칩을 누르면 그 값으로 곧장 간다", async () => {
    const { user } = setup(0);

    await user.click(screen.getByRole("button", { name: "2박 3일" }));

    expect(onChangeNights).toHaveBeenCalledWith(2);
  });

  it("지금 고른 값의 칩만 강조한다", () => {
    setup(1);

    expect(screen.getByRole("button", { name: "1박 2일" }).className).toContain("bg-brand text-white");
    expect(screen.getByRole("button", { name: "당일치기" }).className).not.toContain("bg-brand text-white");
  });

  it("상한을 넘은 값은 칩으로 두지 않는다", () => {
    setup(4);

    expect(screen.queryByRole("button", { name: "3박 4일" })).toBeNull();
  });
});

describe("안내와 다음", () => {
  it("날짜는 나중에 고르면 된다고 미리 알려준다", () => {
    const { container } = setup();

    expect(container.textContent).toContain("날짜는 저장 후 [일정을 추가하기]에서 고르면 돼요");
  });

  it("장소 담기로 넘어간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
