import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSheetStore } from "@/stores/useSheetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePlace } from "@/test/fixtures";
import type { Place } from "@/types";
import ManualCourseWizardPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/schedule" }));

// 장소 시트·지도·공유는 각자 테스트가 있다 — 위저드가 스텝을 엮는 방식만 본다.
vi.mock("@/components/course/PlacePickerSheet", () => ({ PlacePickerSheet: () => null }));
vi.mock("@/components/course/CourseRouteMap", () => ({ CourseRouteMap: () => null }));
vi.mock("@/components/course/ResultShareActions", () => ({ ResultShareActions: () => null }));

const addCourse = vi.fn();

// 좌표를 벌려 두어 "가까운 곳끼리 잇기"가 실제로 순서를 바꾸는지 볼 수 있게 한다.
const 서쪽 = makePlace({ id: "w", name: "서쪽장소", lat: 36.3, lng: 127.2 });
const 가운데 = makePlace({ id: "m", name: "가운데장소", lat: 36.3, lng: 127.35 });
const 동쪽 = makePlace({ id: "e", name: "동쪽장소", lat: 36.3, lng: 127.5 });

function setup() {
  const view = render(<ManualCourseWizardPage />);
  return { ...view, user: userEvent.setup() };
}

/** 시트 없이 장소를 담는다 — 시트는 목이라 스토어의 콜백을 직접 부른다. */
function pickPlaces(places: Place[]) {
  act(() => {
    useSheetStore.getState().onDone?.(places);
  });
}

/** 동선 목록에 그려진 순서대로 장소 이름을 읽는다. */
function routeNames(container: HTMLElement): string[] {
  const list = container.querySelector(".rounded-2xl.border.border-line.bg-card.shadow-sm") as HTMLElement;
  return Array.from(list.querySelectorAll(".text-sm.font-bold")).map((el) => el.textContent ?? "");
}

/** 상단바 제목 — 스텝 이름이 본문에도 섞여 나오므로 상단바 안에서만 읽는다. */
function stepTitle(): string {
  return document.querySelector(".sticky.top-0 .text-base.font-bold")?.textContent ?? "";
}
const addPlaceButton = () => screen.getByRole("button", { name: /장소 추가하기/ });
/** 일차 탭 — "＋ 2일차에 장소 추가하기" 버튼과 구분한다. */
const dayTab = (day: number) => screen.getByRole("button", { name: new RegExp(`^${day}일차`) });

/** 담은 장소 한 줄. 시작점 안내 배너에도 같은 이름이 나오므로 목록 카드 안에서만 찾는다. */
function placeRow(name: string): HTMLElement {
  const list = document.querySelector("div.mb-3.overflow-hidden.rounded-xl") as HTMLElement;
  return Array.from(list.children).find((child) => child.textContent?.includes(name)) as HTMLElement;
}

/** 1단계(설정)에서 장소를 담고 3단계(동선)까지 진행한다. */
async function goToReview(user: ReturnType<typeof userEvent.setup>, places = [서쪽, 동쪽, 가운데]) {
  await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
  await user.click(addPlaceButton());
  pickPlaces(places);
  await user.click(screen.getByRole("button", { name: "최적 동선 확인하기" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00"));
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useToastStore.setState({ message: null, key: 0 });
  useSheetStore.setState({ isOpen: false, title: "", selected: [], onDone: null });
  useCourseStore.setState({ addCourse });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("스텝 이동", () => {
  it("설정 → 장소 → 동선 순으로 제목을 바꿔 단다", async () => {
    const { user } = setup();
    expect(stepTitle()).toBe("직접 짓기");

    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    expect(stepTitle()).toBe("장소 담기");

    await user.click(addPlaceButton());
    pickPlaces([서쪽]);
    await user.click(screen.getByRole("button", { name: "최적 동선 확인하기" }));
    expect(stepTitle()).toBe("동선 확인");
  });

  it("뒤로가기는 화면을 떠나지 않고 스텝을 되돌린다 — 담은 장소를 날리지 않는다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));

    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));

    expect(stepTitle()).toBe("직접 짓기");
    expect(nav.back).not.toHaveBeenCalled();
  });

  it("첫 스텝에서 뒤로가면 위저드를 나간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));

    expect(nav.back).toHaveBeenCalledTimes(1);
  });
});

describe("박 수와 일차", () => {
  it("박 수를 늘린 만큼 일차를 만든다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "2박 3일" }));
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));

    expect(dayTab(1)).toBeTruthy();
    expect(dayTab(3)).toBeTruthy();
  });

  it("일차를 줄이면 그 날 장소를 앞 일차로 합친다 — 조용히 버리지 않는다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "1박 2일" }));
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    await user.click(dayTab(2));
    await user.click(addPlaceButton());
    pickPlaces([동쪽]);

    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));
    await user.click(screen.getByRole("button", { name: "당일치기" }));
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));

    expect(screen.getByText("동쪽장소")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^2일차/ })).toBeNull();
  });
});

describe("시작점 정리", () => {
  it("시작점으로 삼은 곳을 빼면 시작점도 함께 푼다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    await user.click(addPlaceButton());
    pickPlaces([서쪽, 동쪽]);
    await user.click(screen.getByText("서쪽장소"));
    expect(container.textContent).toContain("서쪽장소에서 여행을 시작해요");

    await user.click(within(placeRow("서쪽장소")).getByRole("button", { name: "✕" }));

    expect(container.textContent).toContain("기준 지점을 골라주세요");
  });

  it("다시 담을 때 시작점이 빠졌으면 시작점을 푼다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    await user.click(addPlaceButton());
    pickPlaces([서쪽, 동쪽]);
    await user.click(screen.getByText("서쪽장소"));

    await user.click(addPlaceButton());
    pickPlaces([동쪽]);

    expect(container.textContent).toContain("기준 지점을 골라주세요");
  });

  it("시작점이 그대로 남아 있으면 유지한다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    await user.click(addPlaceButton());
    pickPlaces([서쪽, 동쪽]);
    await user.click(screen.getByText("서쪽장소"));

    await user.click(addPlaceButton());
    pickPlaces([서쪽, 가운데]);

    expect(container.textContent).toContain("서쪽장소에서 여행을 시작해요");
  });
});

describe("동선 계산", () => {
  it("담은 순서가 아니라 가까운 곳끼리 이어 다시 세운다", async () => {
    const { container, user } = setup();

    await goToReview(user);

    expect(routeNames(container)).toEqual(["서쪽장소", "가운데장소", "동쪽장소"]);
  });

  it("고른 시작점에서 출발하도록 다시 센다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "장소 담으러 가기" }));
    await user.click(addPlaceButton());
    pickPlaces([서쪽, 동쪽, 가운데]);
    await user.click(screen.getByText("동쪽장소"));

    await user.click(screen.getByRole("button", { name: "최적 동선 확인하기" }));

    expect(routeNames(container)).toEqual(["동쪽장소", "가운데장소", "서쪽장소"]);
  });
});

describe("저장", () => {
  it("이름을 비우면 오늘 날짜로 기본 이름을 붙인다", async () => {
    const { user } = setup();
    await goToReview(user, [서쪽]);

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse).toHaveBeenCalledWith(
      expect.objectContaining({ label: "9월 14일에 만든 코스", nights: 0, source: "manual", shared: false })
    );
  });

  it("지은 이름이 있으면 그 이름으로 저장한다", async () => {
    const { user } = setup();
    await goToReview(user, [서쪽]);

    await user.type(screen.getByPlaceholderText(/만든 코스/), "유성 산책 코스");
    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse).toHaveBeenCalledWith(expect.objectContaining({ label: "유성 산책 코스" }));
  });

  it("장소는 저장용 스냅샷으로 바꿔 담는다 — 좌표 대신 이름·조건을 남긴다", async () => {
    const { user } = setup();
    await goToReview(user, [서쪽]);

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse.mock.lastCall?.[0].days).toEqual([
      [
        {
          placeId: "w",
          name: "서쪽장소",
          category: "산책",
          district: "서구",
          condition: "전 견종",
          petFriendly: true,
          imageUrl: null,
          placeUrl: null,
        },
      ],
    ]);
  });

  it("저장하면 알리고 내 여정으로 보낸다", async () => {
    const { user } = setup();
    await goToReview(user, [서쪽]);

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(useToastStore.getState().message).toContain("보관함에 저장했어요");
    expect(nav.push).toHaveBeenCalledWith("/schedule");
  });

  it("비로그인이면 저장하지 않고 로그인부터 받는다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();
    await goToReview(user, [서쪽]);

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse).not.toHaveBeenCalled();
    const overlay = screen.getByText("로그인이 필요해요").closest(".fixed");
    expect(overlay?.className).toContain("opacity-100");
  });
});
