import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "@/types";
import HomeFestivalPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/home/festival" }));

const hooks = vi.hoisted(() => ({ useFestivals: vi.fn() }));
vi.mock("@/hooks/useFestivals", () => ({ useFestivals: hooks.useFestivals }));

function makeFestival(overrides: Partial<FestivalEvent> = {}): FestivalEvent {
  return {
    id: "f1",
    date: "2026-09-14",
    title: "대전 반려동물 축제",
    place: "엑스포시민광장",
    petFriendly: true,
    ...overrides,
  };
}

function giveFestivals(list: FestivalEvent[] = [], isLoading = false) {
  hooks.useFestivals.mockReturnValue({ data: list, isLoading });
}

function setup() {
  const view = render(<HomeFestivalPage />);
  return { ...view, user: userEvent.setup({ advanceTimers: vi.advanceTimersByTime }) };
}

/** 달력의 날짜 칸 — 월 이동 버튼(‹ ›)과 구분한다. */
function dayCell(day: string): HTMLElement {
  return screen.getAllByRole("button").find((button) => button.textContent === day)!;
}

/** 그 날 칸에 축제 표시(발바닥 마크)가 찍혔는지 — 동반 가능 여부와 무관하게 있으면 하나만 찍는다. */
function hasFestivalMark(day: string): boolean {
  return dayCell(day).querySelector("svg") !== null;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00"));
  giveFestivals([makeFestival()]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("달력", () => {
  it("오늘이 속한 달을 열고 오늘을 골라 둔다", () => {
    setup();

    expect(screen.getByText("2026년 9월")).toBeTruthy();
    expect(screen.getByText("2026-09-14 일정")).toBeTruthy();
  });

  it("축제가 있는 날에 발바닥 마크를 찍는다", () => {
    setup();

    expect(hasFestivalMark("14")).toBe(true);
    expect(hasFestivalMark("15")).toBe(false);
  });

  it("동반 가능 여부와 무관하게 축제 유무만 본다 — 섞여 있어도 마크는 하나만 찍는다", () => {
    giveFestivals([
      makeFestival({ id: "f1", date: "2026-09-14", petFriendly: true }),
      makeFestival({ id: "f2", date: "2026-09-14", petFriendly: false, petFriendlyUnknown: true }),
    ]);
    setup();

    expect(dayCell("14").querySelectorAll("svg")).toHaveLength(1);
  });

  it("여러 날에 걸친 축제는 그 사이 날에도 표시한다", () => {
    giveFestivals([makeFestival({ date: "2026-09-14", endDate: "2026-09-16" })]);
    setup();

    expect(hasFestivalMark("15")).toBe(true);
    expect(hasFestivalMark("17")).toBe(false);
  });

  it("날짜를 누르면 그 날 일정으로 바꾼다", async () => {
    const { user } = setup();

    await user.click(dayCell("20"));

    expect(screen.getByText("2026-09-20 일정")).toBeTruthy();
  });
});

describe("월 이동", () => {
  it("이전·다음 달로 넘긴다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "›" }));
    expect(screen.getByText("2026년 10월")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.getByText("2026년 9월")).toBeTruthy();
  });

  it("데이터가 없는 과거로는 못 넘어간다 — 봐도 무조건 비어 있다", async () => {
    const { user } = setup();

    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "‹" }));
    expect(screen.getByText("2026년 6월")).toBeTruthy();

    expect(screen.getByRole("button", { name: "‹" }).hasAttribute("disabled")).toBe(true);
  });

  it("먼 미래로도 못 넘어간다", async () => {
    const { user } = setup();

    for (let i = 0; i < 12; i++) await user.click(screen.getByRole("button", { name: "›" }));
    expect(screen.getByText("2027년 9월")).toBeTruthy();

    expect(screen.getByRole("button", { name: "›" }).hasAttribute("disabled")).toBe(true);
  });
});

describe("선택한 날의 축제", () => {
  it("불러오는 중이면 '없다'고 단정하지 않는다", () => {
    giveFestivals([], true);
    setup();

    expect(screen.getByText("축제 정보를 불러오는 중이에요...")).toBeTruthy();
    expect(screen.queryByText("이 날엔 등록된 축제가 없어요.")).toBeNull();
  });

  it("없으면 빈 칸 대신 없다고 말한다", () => {
    giveFestivals([]);
    setup();

    expect(screen.getByText("이 날엔 등록된 축제가 없어요.")).toBeTruthy();
  });

  it("장소와 시간을 함께 적는다", () => {
    giveFestivals([makeFestival({ place: "엑스포시민광장", time: "10:00~18:00" })]);
    setup();

    expect(screen.getByText("엑스포시민광장 · 10:00~18:00")).toBeTruthy();
  });

  it("시간 정보가 없으면 가운뎃점만 덩그러니 남기지 않는다", () => {
    giveFestivals([makeFestival({ place: "엑스포시민광장" })]);
    setup();

    expect(screen.getByText("엑스포시민광장")).toBeTruthy();
  });
});

describe("동반 가능 뱃지", () => {
  /** 선택한 날의 축제 카드에 붙은 뱃지 문구. */
  function petTag(): string {
    const card = screen.getByText("대전 반려동물 축제").closest(".flex.flex-wrap") as HTMLElement;
    // 누를 곳이 없는 태그는 버튼이 아니라 span으로 그려진다.
    return card.querySelector<HTMLElement>(".rounded-full")?.textContent ?? "";
  }

  it("확인된 곳은 동반 가능이라고 한다", () => {
    giveFestivals([makeFestival({ petFriendly: true })]);
    setup();

    expect(petTag()).toBe("동반 가능");
  });

  it("행사는 몰라도 장소가 인증됐으면 그 사실만 따로 표시한다", () => {
    giveFestivals([makeFestival({ petFriendly: false, venuePetFriendly: true, petFriendlyUnknown: true })]);
    setup();

    expect(petTag()).toBe("장소 인증");
  });

  it("모르면 '동반 불가'로 단정하지 않고 미확인이라 적는다", () => {
    giveFestivals([makeFestival({ petFriendly: false, petFriendlyUnknown: true })]);
    setup();

    expect(petTag()).toBe("미확인");
  });

  it("확인된 결과가 불가일 때만 동반 불가라고 한다", () => {
    giveFestivals([makeFestival({ petFriendly: false })]);
    setup();

    expect(petTag()).toBe("동반 불가");
  });
});

describe("날짜 발표 전 대표 축제", () => {
  it("예상 시기 근처를 보고 있을 때만 참고로 알려준다", () => {
    setup();

    // 9월에는 10월 유성온천문화축제가 한 달 앞이라 보인다.
    expect(screen.getByText("유성온천문화축제")).toBeTruthy();
  });

  it("예상 시기가 지난 축제는 접는다 — 틀린 날짜를 캘린더에 꽂지 않는다", async () => {
    const { user } = setup();

    // 8월 대전0시축제는 9월에도 한 달 뒤라 보이지만, 12월까지 가면 접힌다.
    await user.click(screen.getByRole("button", { name: "›" }));
    await user.click(screen.getByRole("button", { name: "›" }));
    await user.click(screen.getByRole("button", { name: "›" }));

    expect(screen.getByText("2026년 12월")).toBeTruthy();
    expect(screen.queryByText("대전0시축제")).toBeNull();
    expect(screen.queryByText("유성온천문화축제")).toBeNull();
  });

  it("정확한 날짜는 공식 채널에서 확인하라고 덧붙인다", () => {
    setup();

    expect(screen.getByText("공식 채널에서 정확한 날짜를 확인해주세요")).toBeTruthy();
  });
});
