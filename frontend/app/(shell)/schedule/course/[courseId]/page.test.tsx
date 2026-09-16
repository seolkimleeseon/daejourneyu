import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useSheetStore } from "@/stores/useSheetStore";
import { makeCourse, makePlace, makeSchedule, makeStop } from "@/test/fixtures";
import CourseDetailPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav, usePathname: () => "/schedule" }));

vi.mock("@/hooks/useSyncCoursesFromApi", () => ({ useSyncCoursesFromApi: vi.fn() }));

// 지도·공유·장소 시트는 각자 테스트가 있다 — 상세 화면이 엮는 방식만 본다.
vi.mock("@/components/course/CourseRouteMap", () => ({ CourseRouteMap: () => null }));
vi.mock("@/components/course/PlacePickerSheet", () => ({ PlacePickerSheet: () => null }));
const share = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/course/ResultShareActions", () => ({
  ResultShareActions: (props: Record<string, unknown>) => {
    share.render(props);
    return <div data-testid="share-actions" />;
  },
}));

const updateCourse = vi.fn();
const deleteCourse = vi.fn();

const 갑천 = makeStop({ placeId: "a", name: "갑천", district: "유성구", category: "산책" });
const 댕댕카페 = makeStop({ placeId: "b", name: "댕댕카페", district: "유성구", category: "맛집" });

const course = makeCourse({
  id: "c1",
  label: "유성 산책 코스",
  emoji: null,
  nights: 0,
  source: "ai",
  transport: "자차",
  days: [[갑천, 댕댕카페]],
});

function setup(courseId = "c1") {
  const view = render(<CourseDetailPage params={{ courseId }} />);
  return { ...view, user: userEvent.setup() };
}

/** 동선 목록의 한 줄. */
function stopRow(name: string): HTMLElement {
  return screen.getByText(name).closest("div.flex.items-center") as HTMLElement;
}

/** 모달은 닫혀 있어도 DOM에 남는다 — 열림 여부는 겉면 불투명도로 본다. */
function modalOpen(text: string): boolean {
  return screen.getByText(text).closest(".fixed")?.className.includes("opacity-100") ?? false;
}

/** 바텀시트도 닫힌 채로 남는다 — 이쪽은 아래로 밀어내 감추므로 위치로 본다. */
function sheetOpen(text: string): boolean {
  return screen.getByText(text).closest(".fixed")?.className.includes("translate-y-0") ?? false;
}

/** 본문 버튼 — 항상 DOM에 남아 있는 모달·시트 안의 같은 이름 버튼과 구분한다. */
function pageButton(name: RegExp | string): HTMLElement {
  const matched = screen.getAllByRole("button", { name }).filter((button) => !button.closest(".fixed"));
  return matched[0];
}

/** 티켓에 큼직하게 적힌 코스 이름 — 상단바 제목에도 같은 이름이 나온다. */
function ticketLabel(): string {
  return document.querySelector(".text-base.font-extrabold.tracking-tight")?.textContent ?? "";
}

const editButton = () => screen.getByRole("button", { name: /코스 편집하기/ });

async function enterEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(editButton());
}

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollTo = vi.fn();
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  useSheetStore.setState({ isOpen: false, title: "", selected: [], onDone: null });
  useCourseStore.setState({
    courses: [course],
    schedules: [],
    hasSynced: true,
    updateCourse,
    deleteCourse,
  });
});

describe("들어갈 수 있는지", () => {
  it("비로그인이면 코스 대신 로그인 안내를 보여준다", () => {
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByText("저장된 코스는 로그인해야 볼 수 있어요")).toBeTruthy();
  });

  it("서버 목록이 오기 전엔 '없는 코스'라고 단정하지 않는다 — 링크로 바로 들어올 수 있다", () => {
    useCourseStore.setState({ hasSynced: false, courses: [] });
    setup();

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
    expect(screen.queryByText(/코스를 찾을 수 없어요/)).toBeNull();
  });

  it("동기화까지 끝났는데 없으면 그제서야 없다고 말한다", () => {
    useCourseStore.setState({ hasSynced: true, courses: [] });
    setup();

    expect(screen.getByText(/코스를 찾을 수 없어요/)).toBeTruthy();
  });
});

describe("티켓", () => {
  it("이름과 출처·기간·이동수단을 함께 보여준다", () => {
    setup();

    expect(ticketLabel()).toBe("유성 산책 코스");
    expect(screen.getByText("AI 추천")).toBeTruthy();
    expect(screen.getByText("☀️ 당일치기")).toBeTruthy();
    expect(screen.getByText("🚗 자차")).toBeTruthy();
  });

  it("대표 이모지를 안 골랐으면 출처에 맞는 기본 이모지를 쓴다", () => {
    const { container } = setup();

    // ✨는 Emoji3D 3D 렌더 대상이라 텍스트가 아니라 이미지로 나온다.
    expect(container.querySelector('img[src*="sparkles_3d"]')).toBeTruthy();
  });

  it("공유하지 않은 코스엔 공유됨 표시를 달지 않는다", () => {
    setup();

    expect(screen.queryByText("🔗 공유됨")).toBeNull();
  });

  it("공유한 코스에는 공유됨 표시를 단다", () => {
    useCourseStore.setState({ courses: [makeCourse({ ...course, shared: true })] });
    setup();

    expect(screen.getByText("🔗 공유됨")).toBeTruthy();
  });

  it("잡아둔 날짜가 있으면 티켓에 함께 적는다", () => {
    useCourseStore.setState({
      schedules: [
        makeSchedule({ id: "s2", courseId: "c1", date: "2026-10-03" }),
        makeSchedule({ id: "s1", courseId: "c1", date: "2026-09-20", festivalTitles: ["대전 0시 축제"] }),
      ],
    });
    const { container } = setup();

    const dates = Array.from(container.querySelectorAll(".rounded-xl.bg-card.px-3.py-2")).map(
      (el) => el.textContent
    );
    expect(dates).toEqual([
      "2026-09-20에 가기로 했어요 · 대전 0시 축제",
      "2026-10-03에 가기로 했어요",
    ]);
  });
});

describe("동선", () => {
  it("하루짜리면 일차 번호 없이 곳 수만 적는다", () => {
    setup();

    expect(screen.getByText("동선 · 2곳")).toBeTruthy();
  });

  it("여러 날이면 일차마다 나누고 넘겨볼 점을 둔다", () => {
    useCourseStore.setState({
      courses: [makeCourse({ ...course, nights: 1, days: [[갑천], [댕댕카페]] })],
    });
    setup();

    expect(screen.getByText("1일차 동선 · 1곳")).toBeTruthy();
    expect(screen.getByText("2일차 동선 · 1곳")).toBeTruthy();
    expect(screen.getByRole("button", { name: "2일차 보기" })).toBeTruthy();
  });

  it("확정된 조건은 동반 가능 여부와 출처를 같이 보여준다", () => {
    useCourseStore.setState({
      courses: [
        makeCourse({
          ...course,
          days: [[makeStop({ placeId: "a", name: "갑천", condition: "식약처 인증 · 전 견종 동반 가능" })]],
        }),
      ],
    });
    setup();

    expect(within(stopRow("갑천")).getByText("동반 가능")).toBeTruthy();
    expect(within(stopRow("갑천")).getByText("식약처 인증")).toBeTruthy();
  });

  it("확인이 필요한 조건이면 '동반 가능'이라 단정하지 않는다", () => {
    useCourseStore.setState({
      courses: [
        makeCourse({
          ...course,
          days: [
            [
              makeStop({
                placeId: "a",
                name: "갑천",
                condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
              }),
            ],
          ],
        }),
      ],
    });
    setup();

    expect(within(stopRow("갑천")).getByText("카카오맵 검색 결과")).toBeTruthy();
    expect(within(stopRow("갑천")).getByText("🔍 동반 가능 여부 확인 필요")).toBeTruthy();
    expect(within(stopRow("갑천")).queryByText("동반 가능")).toBeNull();
  });
});

describe("장소로 이동", () => {
  it("우리 장소는 상세 페이지로 보낸다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("갑천"));

    expect(nav.push).toHaveBeenCalledWith("/place/%EA%B0%91%EC%B2%9C");
  });

  it("카카오 검색으로 담긴 곳은 앱 안에서 미리보기로 연다 — 우리 상세엔 없는 장소다", async () => {
    useCourseStore.setState({
      courses: [makeCourse({ ...course, days: [[makeStop({ placeId: "kakao-9", name: "카카오카페" })]] })],
    });
    const { user } = setup();

    await user.click(screen.getByText("카카오카페"));

    expect(nav.push).not.toHaveBeenCalled();
    expect(sheetOpen("🔍 동반 가능 여부 확인 필요")).toBe(true);
  });
});

describe("다음 행동", () => {
  it("잡아둔 날짜가 없으면 일정을 붙이러 보낸다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /일정을 추가하기/ }));

    expect(nav.push).toHaveBeenCalledWith("/schedule/course/c1/schedule");
  });

  it("이미 날짜가 있으면 문구를 편집으로 바꾼다", () => {
    useCourseStore.setState({ schedules: [makeSchedule({ id: "s1", courseId: "c1" })] });
    setup();

    expect(screen.getByRole("button", { name: /여행 계획 편집하기/ })).toBeTruthy();
  });

  it("공유 문구에 기간과 곳 수를 담는다", () => {
    setup();

    expect(share.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fileName: "대저니유-유성 산책 코스",
        kakaoTitle: "유성 산책 코스",
        kakaoDescription: "당일치기 · 2곳 · 대저니유에서 만든 반려동물 여행 코스예요 🐾",
        path: "/schedule/course/c1",
      })
    );
  });

  it("이미 공유한 코스는 다시 공유하라고 권하지 않는다", () => {
    useCourseStore.setState({ courses: [makeCourse({ ...course, shared: true })] });
    setup();

    expect(screen.queryByRole("button", { name: /둘러보기에 공유하기/ })).toBeNull();
  });

  it("남에게서 담아온 코스도 내 것처럼 공유하라고 권하지 않는다", () => {
    useCourseStore.setState({ courses: [makeCourse({ ...course, source: "saved" })] });
    setup();

    expect(screen.queryByRole("button", { name: /둘러보기에 공유하기/ })).toBeNull();
  });
});

describe("편집", () => {
  it("편집에 들어가면 제목을 바꾸고 현재 이름을 입력창에 채운다", async () => {
    const { user } = setup();

    await enterEdit(user);

    expect(screen.getByText("코스 편집")).toBeTruthy();
    expect((screen.getByPlaceholderText("코스 이름") as HTMLInputElement).value).toBe("유성 산책 코스");
  });

  it("뒤로가기는 화면을 떠나지 않고 편집만 그만둔다", async () => {
    const { user } = setup();
    await enterEdit(user);

    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));

    expect(nav.back).not.toHaveBeenCalled();
    expect(editButton()).toBeTruthy();
  });

  it("이름과 이모지를 바꿔 저장한다", async () => {
    const { user } = setup();
    await enterEdit(user);

    await user.clear(screen.getByPlaceholderText("코스 이름"));
    await user.type(screen.getByPlaceholderText("코스 이름"), "가을 산책");
    await user.click(screen.getByRole("button", { name: /대표 이모지 바꾸기/ }));
    await user.click(screen.getByRole("button", { name: "🌸" }));
    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    expect(updateCourse).toHaveBeenCalledWith("c1", {
      label: "가을 산책",
      emoji: "🌸",
      days: [[갑천, 댕댕카페]],
    });
  });

  it("이름을 비운 채로는 저장하지 않는다 — 이름 없는 코스가 보관함에 남는다", async () => {
    const { user } = setup();
    await enterEdit(user);

    await user.clear(screen.getByPlaceholderText("코스 이름"));
    await user.click(screen.getByRole("button", { name: /저장하기/ }));

    expect(updateCourse).not.toHaveBeenCalled();
    expect(screen.getByText("코스 편집")).toBeTruthy();
  });

  it("취소하면 고치던 내용을 버리고 원래 이름으로 돌아간다", async () => {
    const { user } = setup();
    await enterEdit(user);
    await user.clear(screen.getByPlaceholderText("코스 이름"));
    await user.type(screen.getByPlaceholderText("코스 이름"), "안 쓸 이름");

    await user.click(pageButton("취소"));

    expect(updateCourse).not.toHaveBeenCalled();
    expect(ticketLabel()).toBe("유성 산책 코스");
  });

  it("장소를 빼면 그 줄만 사라진다", async () => {
    const { user } = setup();
    await enterEdit(user);

    await user.click(within(stopRow("댕댕카페")).getByRole("button", { name: "✕" }));

    expect(screen.queryByText("댕댕카페")).toBeNull();
    expect(screen.getByText("갑천")).toBeTruthy();
  });

  it("마지막 한 곳은 뺄 수 없다 — 장소 없는 일차를 만들지 않는다", async () => {
    useCourseStore.setState({ courses: [makeCourse({ ...course, days: [[갑천]] })] });
    const { user } = setup();
    await enterEdit(user);

    expect(within(stopRow("갑천")).getByRole("button", { name: "✕" }).hasAttribute("disabled")).toBe(true);
  });

  it("장소 추가는 그 일차를 밝혀 시트를 연다", async () => {
    useCourseStore.setState({
      courses: [makeCourse({ ...course, nights: 1, days: [[갑천], [댕댕카페]] })],
    });
    const { user } = setup();
    await enterEdit(user);

    await user.click(screen.getAllByRole("button", { name: /장소 추가하기/ })[1]);

    expect(useSheetStore.getState().title).toBe("2일차에 장소 추가");
  });

  it("고른 장소를 그 일차 끝에 붙인다", async () => {
    const { user } = setup();
    await enterEdit(user);
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    act(() => {
      useSheetStore.getState().onDone?.([makePlace({ id: "c", name: "장태산", district: "서구" })]);
    });

    expect(screen.getByText("장태산")).toBeTruthy();
  });

  it("이미 담긴 장소는 다시 붙이지 않는다", async () => {
    const { user } = setup();
    await enterEdit(user);
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    act(() => {
      useSheetStore.getState().onDone?.([makePlace({ id: "a", name: "갑천", district: "유성구" })]);
    });

    expect(screen.getAllByText("갑천")).toHaveLength(1);
  });
});

describe("삭제", () => {
  it("바로 지우지 않고 되돌릴 수 없다는 걸 먼저 알린다", async () => {
    const { user } = setup();
    await enterEdit(user);

    await user.click(pageButton(/삭제/));

    expect(modalOpen("이 코스를 삭제할까요?")).toBe(true);
    expect(deleteCourse).not.toHaveBeenCalled();
  });

  it("확인하면 지우고 보관함으로 되돌린다 — 뒤로가기로 없는 코스에 오지 않게 replace한다", async () => {
    const { user } = setup();
    await enterEdit(user);
    await user.click(pageButton(/삭제/));

    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    expect(deleteCourse).toHaveBeenCalledWith("c1");
    expect(nav.replace).toHaveBeenCalledWith("/schedule/vault");
  });
});
