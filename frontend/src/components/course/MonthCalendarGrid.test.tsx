import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonthCalendarGrid } from "@/components/course/MonthCalendarGrid";

function setup(selectedDate = "2026-09-14", markedDates?: Set<string>) {
  const onSelectDate = vi.fn();
  const view = render(
    <MonthCalendarGrid
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      markedDates={markedDates}
    />
  );
  return { ...view, onSelectDate, user: userEvent.setup() };
}

/** 날짜 칸만 고른다 — 주 헤더(일~토)와 이전/다음 버튼은 제외된다. */
function dayCell(day: string): HTMLElement {
  return screen
    .getAllByRole("button")
    .find((button) => button.textContent === day && !["‹", "›"].includes(button.textContent))!;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("MonthCalendarGrid", () => {
  it("선택한 날짜가 속한 달을 연다", () => {
    setup("2026-09-14");

    expect(screen.getByText("2026년 9월")).toBeTruthy();
  });

  it("요일 머리글을 일요일부터 둔다", () => {
    const { container } = setup();

    const header = container.querySelectorAll(".grid-cols-7")[0];
    expect(within(header as HTMLElement).getByText("일")).toBeTruthy();
    expect(header?.textContent).toBe("일월화수목금토");
  });

  it("그 달의 날짜를 빠짐없이 그린다", () => {
    setup("2026-09-14");

    // 2026년 9월은 30일까지.
    expect(dayCell("1")).toBeTruthy();
    expect(dayCell("30")).toBeTruthy();
    expect(screen.queryByText("31")).toBeNull();
  });

  it("달마다 마지막 날이 다른 것을 반영한다", () => {
    setup("2026-02-10");

    // 2026년 2월은 28일까지(윤년 아님).
    expect(dayCell("28")).toBeTruthy();
    expect(screen.queryByText("29")).toBeNull();
  });

  it("1일이 시작하는 요일만큼 앞을 비운다", () => {
    const { container } = setup("2026-09-14");

    // 2026-09-01은 화요일 → 앞에 빈 칸 2개(일·월).
    const grid = container.querySelectorAll(".grid-cols-7")[1];
    const leadingEmpties = Array.from(grid!.children).findIndex((child) => child.tagName === "BUTTON");
    expect(leadingEmpties).toBe(2);
  });

  it("날짜를 누르면 YYYY-MM-DD로 올려보낸다", async () => {
    const { user, onSelectDate } = setup("2026-09-14");

    await user.click(dayCell("3"));

    expect(onSelectDate).toHaveBeenCalledWith("2026-09-03");
  });

  it("선택한 날짜를 강조한다", () => {
    setup("2026-09-14");

    expect(dayCell("14").className).toContain("bg-brand-100");
    expect(dayCell("15").className).not.toContain("bg-brand-100");
  });

  it("오늘은 테두리로만 구분한다 — 선택과 헷갈리면 안 된다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-20T09:00:00+09:00"));
    setup("2026-09-14");

    expect(dayCell("20").className).toContain("border-brand");
    expect(dayCell("20").className).not.toContain("bg-brand-100");
  });

  it("이미 일정이 있는 날에는 점을 찍는다", () => {
    setup("2026-09-14", new Set(["2026-09-18"]));

    expect(dayCell("18").querySelector(".rounded-full")).toBeTruthy();
    expect(dayCell("19").querySelector(".rounded-full")).toBeNull();
  });

  it("이전·다음 달로 넘길 수 있다", async () => {
    const { user } = setup("2026-09-14");

    await user.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.getByText("2026년 8월")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "›" }));
    await user.click(screen.getByRole("button", { name: "›" }));
    expect(screen.getByText("2026년 10월")).toBeTruthy();
  });

  it("해를 넘겨도 연도를 맞춰 바꾼다", async () => {
    const { user } = setup("2026-01-15");

    await user.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.getByText("2025년 12월")).toBeTruthy();
  });

  it("12월에서 다음 달로 가면 이듬해 1월이다", async () => {
    const { user } = setup("2026-12-15");

    await user.click(screen.getByRole("button", { name: "›" }));
    expect(screen.getByText("2027년 1월")).toBeTruthy();
  });

  it("달을 넘겨도 선택된 날짜는 그대로 유지한다", async () => {
    const { user, onSelectDate } = setup("2026-09-14");

    await user.click(screen.getByRole("button", { name: "›" }));

    expect(onSelectDate).not.toHaveBeenCalled();
    expect(screen.getByText("2026년 10월")).toBeTruthy();
  });
});
