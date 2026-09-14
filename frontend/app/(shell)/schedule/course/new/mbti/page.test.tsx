import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MBTI_QUESTIONS, MBTI_TYPES, scoreAnswers } from "@/lib/mbti";
import type { PickablePlace } from "@/lib/petTourMapper";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makeMbtiResult, makePet, makePlace } from "@/test/fixtures";
import MbtiCourseWizardPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }));
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/schedule",
  useSearchParams: () => search.params,
}));

const pickable = vi.hoisted(() => ({ usePickablePlaces: vi.fn() }));
vi.mock("@/hooks/usePickablePlaces", () => ({ usePickablePlaces: pickable.usePickablePlaces }));

// 지도·공유는 각자 테스트가 있다 — 위저드가 스텝을 엮는 방식만 본다.
vi.mock("@/components/course/CourseRouteMap", () => ({ CourseRouteMap: () => null }));
vi.mock("@/components/course/ResultShareActions", () => ({ ResultShareActions: () => null }));

const addCourse = vi.fn();
const saveMbti = vi.fn();

function pick(overrides: Partial<PickablePlace>): PickablePlace {
  return { ...makePlace(), imageUrl: null, ...overrides };
}

/**
 * 카테고리마다 3곳 이상 둬서 목데이터 보충(ensureCategoryMinimum)이 끼어들지 않게 한다.
 * 산책은 유성구에 몰아두어 "테마 장소가 많은 구부터 배정"이 눈에 보이게 한다.
 */
const pool: PickablePlace[] = [
  ...[1, 2, 3].map((n) => pick({ id: `us${n}`, name: `유성산책${n}`, district: "유성구", category: "산책" })),
  ...[1, 2].map((n) => pick({ id: `um${n}`, name: `유성맛집${n}`, district: "유성구", category: "맛집" })),
  pick({ id: "up1", name: "유성놀이터1", district: "유성구", category: "놀이터" }),
  pick({ id: "uc1", name: "유성문화1", district: "유성구", category: "문화" }),
  pick({ id: "ss1", name: "서구산책1", district: "서구", category: "산책" }),
  pick({ id: "sm1", name: "서구맛집1", district: "서구", category: "맛집" }),
  ...[1, 2].map((n) => pick({ id: `sp${n}`, name: `서구놀이터${n}`, district: "서구", category: "놀이터" })),
  ...[1, 2].map((n) => pick({ id: `sc${n}`, name: `서구문화${n}`, district: "서구", category: "문화" })),
];

function setup() {
  const view = render(<MbtiCourseWizardPage />);
  return { ...view, user: userEvent.setup() };
}

/** 저장된 결과에서 곧장 결과 화면으로 여는 지름길로 들어간다(퀴즈 13문항을 건너뛴다). */
function enterWithSavedResult(code = "ISTJ") {
  search.params = new URLSearchParams("quick=1");
  usePetStore.setState({
    pets: [makePet({ id: "pet-1", mbti: makeMbtiResult({ code }) })],
    activePetIndex: 0,
    saveMbti,
  });
}

/** 상단바 제목 — 단계 이름이 본문에도 섞여 나오므로 상단바 안에서만 읽는다. */
function stepTitle(): string {
  return document.querySelector(".sticky.top-0 .text-base.font-bold")?.textContent ?? "";
}

/** 생성된 코스의 일차별 장소 이름. */
function generatedDays(container: HTMLElement): string[][] {
  return Array.from(container.querySelectorAll(".rounded-2xl.border.border-line.bg-card.shadow-sm")).map((list) =>
    Array.from(list.querySelectorAll(".text-sm.font-bold")).map((el) => el.textContent ?? "")
  );
}

/** 13문항을 모두 "반반이에요"로 답한다 — 모든 축이 동점이라 결과가 한 가지로 정해진다. */
async function answerAllNeutral(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < MBTI_QUESTIONS.length; i++) {
    await user.click(screen.getByText("반반이에요"));
  }
}

const NEUTRAL_CODE = scoreAnswers(Array(MBTI_QUESTIONS.length).fill("NEUTRAL"));

beforeEach(() => {
  vi.clearAllMocks();
  search.params = new URLSearchParams();
  pickable.usePickablePlaces.mockReturnValue({ data: pool });
  saveMbti.mockResolvedValue({ ok: true });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
  usePetStore.setState({ pets: [makePet({ id: "pet-1" })], activePetIndex: 0, saveMbti });
  useToastStore.setState({ message: null, key: 0 });
  useCourseStore.setState({ addCourse });
});

describe("검사 흐름", () => {
  it("소개 화면부터 연다", () => {
    setup();

    expect(stepTitle()).toBe("반려동물 여행 MBTI");
    expect(screen.getByRole("button", { name: "테스트 시작하기" })).toBeTruthy();
  });

  it("시작하면 첫 질문부터 하나씩 넘긴다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));
    expect(screen.getByText(`질문 1 / ${MBTI_QUESTIONS.length}`)).toBeTruthy();

    await user.click(screen.getByText("반반이에요"));
    expect(screen.getByText(`질문 2 / ${MBTI_QUESTIONS.length}`)).toBeTruthy();
  });

  it("건너뛰기도 한 문항을 지나간 것으로 친다 — 멈춰 세우지 않는다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await user.click(screen.getByRole("button", { name: /건너뛰기/ }));

    expect(screen.getByText(`질문 2 / ${MBTI_QUESTIONS.length}`)).toBeTruthy();
  });

  it("이전 질문으로 되돌아간다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));
    await user.click(screen.getByText("반반이에요"));

    await user.click(screen.getByRole("button", { name: /이전 질문/ }));

    expect(screen.getByText(`질문 1 / ${MBTI_QUESTIONS.length}`)).toBeTruthy();
  });

  it("마지막 문항까지 답하면 결과를 낸다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await answerAllNeutral(user);

    expect(stepTitle()).toBe("테스트 결과");
    expect(screen.getByText(NEUTRAL_CODE)).toBeTruthy();
  });

  it("결과에서 다시 검사하면 처음 문항으로 돌아간다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));
    await answerAllNeutral(user);

    await user.click(screen.getByRole("button", { name: /다시 검사하기/ }));

    expect(screen.getByText(`질문 1 / ${MBTI_QUESTIONS.length}`)).toBeTruthy();
  });
});

describe("결과 저장", () => {
  it("검사를 마치면 활성 반려동물에 결과를 남긴다 — 다시 들어와도 남아 있어야 한다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await answerAllNeutral(user);

    const type = MBTI_TYPES[NEUTRAL_CODE];
    expect(saveMbti).toHaveBeenCalledWith("pet-1", {
      code: type.code,
      name: type.name,
      theme: expect.any(String),
      traits: type.traits,
    });
  });

  it("등록된 반려동물이 없으면 저장할 곳이 없으니 흐름만 이어간다", async () => {
    usePetStore.setState({ pets: [], activePetIndex: 0, saveMbti });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await answerAllNeutral(user);

    expect(saveMbti).not.toHaveBeenCalled();
    expect(stepTitle()).toBe("테스트 결과");
  });

  it("비로그인이면 저장을 시도하지 않는다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await answerAllNeutral(user);

    expect(saveMbti).not.toHaveBeenCalled();
  });

  it("저장에 실패하면 결과는 보여주되 저장 실패를 알린다", async () => {
    saveMbti.mockResolvedValue({ ok: false, message: "여행 유형을 저장하지 못했어요" });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    await answerAllNeutral(user);

    await waitFor(() => expect(useToastStore.getState().message).toBe("여행 유형을 저장하지 못했어요"));
    expect(stepTitle()).toBe("테스트 결과");
  });
});

describe("지름길로 들어오기", () => {
  it("저장된 결과가 있으면 퀴즈를 건너뛰고 결과부터 보여준다", () => {
    enterWithSavedResult("ISTJ");
    setup();

    expect(stepTitle()).toBe("테스트 결과");
    expect(screen.getByText("ISTJ")).toBeTruthy();
  });

  it("비로그인이면 지름길을 열지 않는다 — 남의 결과일 수 있다", () => {
    enterWithSavedResult("ISTJ");
    useAuthStore.setState({ isLoggedIn: false });
    setup();

    expect(screen.getByRole("button", { name: "테스트 시작하기" })).toBeTruthy();
  });

  it("저장된 결과가 없으면 quick으로 들어와도 소개부터 시작한다", () => {
    search.params = new URLSearchParams("quick=1");
    setup();

    expect(screen.getByRole("button", { name: "테스트 시작하기" })).toBeTruthy();
  });
});

describe("코스 만들기", () => {
  beforeEach(() => {
    enterWithSavedResult("ISTJ"); // 산책 70% — 테마가 산책으로 정해진다
  });

  it("결과에서 이어가면 기간 고르기로 넘어간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));

    expect(stepTitle()).toBe("산책형 코스");
    expect(screen.getByText("산책형 코스로 추천해드려요")).toBeTruthy();
  });

  it("당일치기는 한 날에 3곳을 담는다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(generatedDays(container)).toEqual([["유성맛집1", "유성산책1", "유성산책2"]]);
  });

  it("여러 날이면 날마다 다른 구를 배정한다 — 하루 동선이 대전 전역으로 흩어지지 않게", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));
    await user.click(screen.getByRole("button", { name: "1박 2일" }));

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(generatedDays(container)).toEqual([
      ["유성맛집1", "유성산책1"],
      ["서구맛집1", "서구산책1"],
    ]);
  });

  it("테마가 맛집이 아니어도 날마다 맛집을 한 곳 넣는다 — 밥 먹을 곳은 있어야 한다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));
    await user.click(screen.getByRole("button", { name: "2박 3일" }));

    await user.click(screen.getByRole("button", { name: "다음" }));

    generatedDays(container).forEach((day) => {
      expect(day.some((name) => name.includes("맛집"))).toBe(true);
    });
  });

  it("같은 장소를 두 날에 겹쳐 넣지 않는다", async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));
    await user.click(screen.getByRole("button", { name: "2박 3일" }));

    await user.click(screen.getByRole("button", { name: "다음" }));

    const all = generatedDays(container).flat();
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("저장과 뒤로가기", () => {
  beforeEach(() => {
    enterWithSavedResult("ISTJ");
  });

  async function generate(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));
    await user.click(screen.getByRole("button", { name: "다음" }));
  }

  it("테마 이름을 코스 제목으로 붙여 AI 코스로 저장한다", async () => {
    const { user } = setup();
    await generate(user);

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "청량 힐링 산책 데이",
        nights: 0,
        transport: "자차",
        source: "ai",
        shared: false,
      })
    );
    expect(nav.push).toHaveBeenCalledWith("/schedule");
  });

  it("실 API가 빈손이어도 목데이터로 채워 빈 코스를 내놓지 않는다", async () => {
    pickable.usePickablePlaces.mockReturnValue({ data: [] });
    const { container, user } = setup();

    await generate(user);

    expect(generatedDays(container)[0].length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));
    expect(addCourse).toHaveBeenCalled();
  });

  it("비로그인이면 저장하지 않고 로그인부터 받는다", async () => {
    const { user } = setup();
    await generate(user);
    useAuthStore.setState({ isLoggedIn: false });

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(addCourse).not.toHaveBeenCalled();
    expect(screen.getByText("로그인이 필요해요").closest(".fixed")?.className).toContain("opacity-100");
  });

  it("홈으로 나갈 길도 둔다", async () => {
    const { user } = setup();
    await generate(user);

    await user.click(screen.getByRole("button", { name: "홈으로" }));

    expect(nav.push).toHaveBeenCalledWith("/home");
  });

  it("뒤로가기는 코스 → 기간 → 결과 → 소개로 한 단계씩 되돌린다", async () => {
    const { user } = setup();
    await generate(user);
    const back = () => screen.getByRole("button", { name: "‹ 뒤로" });

    await user.click(back());
    expect(screen.getByText("며칠 코스로 만들까요?")).toBeTruthy();

    await user.click(back());
    expect(stepTitle()).toBe("테스트 결과");

    await user.click(back());
    expect(screen.getByRole("button", { name: "테스트 시작하기" })).toBeTruthy();
  });

  it("소개 화면에서 뒤로가면 위저드를 나간다", async () => {
    search.params = new URLSearchParams();
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "‹ 뒤로" }));

    expect(nav.back).toHaveBeenCalledTimes(1);
  });

  it("기간·코스 단계에서만 스텝바를 단다 — 검사 중엔 진행 표시가 따로 있다", async () => {
    const { container, user } = setup();
    expect(container.textContent).not.toContain("기간");

    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));

    expect(container.textContent).toContain("기간");
  });
});
