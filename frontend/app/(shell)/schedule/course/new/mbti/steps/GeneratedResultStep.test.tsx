import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makePlace } from "@/test/fixtures";
import { GeneratedResultStep } from "./GeneratedResultStep";

/** 지도는 카카오 SDK가 있어야 그려진다 — 일차별로 무엇을 넘겼는지만 남기고 비운다. */
const map = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/course/CourseRouteMap", () => ({
  CourseRouteMap: (props: { places?: unknown[] }) => {
    map.render(props.places);
    return <div data-testid="route-map" />;
  },
}));

/** 공유 액션은 자체 테스트가 있다 — 여기선 무엇을 넘기는지만 본다. */
const share = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/course/ResultShareActions", () => ({
  ResultShareActions: (props: Record<string, unknown>) => {
    share.render(props);
    return <div data-testid="share-actions" />;
  },
}));

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원", district: "서구" });
const 댕댕카페 = makePlace({ id: "p2", name: "댕댕카페", district: "유성구", category: "맛집" });
const 시립미술관 = makePlace({ id: "p3", name: "시립미술관", district: "서구", category: "문화" });

const handlers = { onReorderDay: vi.fn(), onRegenerate: vi.fn(), onSave: vi.fn(), onGoHome: vi.fn() };

function setup(props: Partial<React.ComponentProps<typeof GeneratedResultStep>> = {}) {
  const view = render(
    <GeneratedResultStep
      theme="산책"
      nights={0}
      days={[[한밭수목원, 댕댕카페]]}
      courseTitle="유성 산책 코스"
      {...handlers}
      {...props}
    />
  );
  return { ...view, user: userEvent.setup() };
}

const editToggle = () => screen.getByRole("button", { name: /순서 편집|✓ 완료/ });

/** 화면 밖 공유 카드에도 같은 문구가 실려 있어, 실제로 보이는 쪽만 고른다. */
function onScreen(text: string): HTMLElement[] {
  return screen.queryAllByText(text).filter((el) => !el.closest('[aria-hidden="true"]'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("완성 요약", () => {
  it("만들어진 코스 이름으로 완성을 알린다", () => {
    setup();

    expect(screen.getByText(/‘유성 산책 코스’가 완성됐어요/)).toBeTruthy();
  });

  it("당일치기면 해를, 묵고 오면 달을 붙인다", () => {
    setup();
    expect(screen.getByText("☀️ 당일치기")).toBeTruthy();
  });

  it("1박 이상이면 달로 바뀐다", () => {
    setup({ nights: 1, days: [[한밭수목원], [시립미술관]] });

    expect(onScreen("1박 2일")).toHaveLength(1);
  });

  it("이동 수단은 더 이상 알리지 않는다 — 고를 수 있는 값이 아니라 자차로 고정된 값이다", () => {
    setup();

    expect(screen.queryByText(/자차|대중교통/)).toBeNull();
  });
});

describe("일차별 동선", () => {
  it("하루짜리면 일차 대신 테마로 이름 붙인다 — '1일차'는 알려주는 게 없다", () => {
    setup({ theme: "맛집" });

    expect(screen.getByText("맛집형 동선 · 2곳")).toBeTruthy();
  });

  it("여러 날이면 일차마다 동선과 곳 수를 적는다", () => {
    setup({ nights: 1, days: [[한밭수목원, 댕댕카페], [시립미술관]] });

    expect(screen.getByText("1일차 동선 · 2곳")).toBeTruthy();
    expect(screen.getByText("2일차 동선 · 1곳")).toBeTruthy();
  });

  it("일차마다 지도를 따로 꽂는다 — 하루 동선을 한 장에 몰아 그리면 읽히지 않는다", () => {
    setup({ nights: 1, days: [[한밭수목원], [시립미술관]] });

    expect(screen.getAllByTestId("route-map")).toHaveLength(2);
    expect(map.render).toHaveBeenNthCalledWith(1, [한밭수목원]);
    expect(map.render).toHaveBeenNthCalledWith(2, [시립미술관]);
  });

  it("빈 일차에는 지도를 띄우지 않는다", () => {
    setup({ nights: 1, days: [[한밭수목원], []] });

    expect(screen.getAllByTestId("route-map")).toHaveLength(1);
  });

  it("장소마다 구와 분류를 함께 적는다", () => {
    setup();

    expect(onScreen("유성구 · 맛집")).toHaveLength(1);
  });

  it("확인이 필요한 조건이면 '동반 가능'이라 단정하지 않는다", () => {
    setup({
      days: [
        [
          makePlace({
            id: "x",
            name: "카카오카페",
            condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
          }),
        ],
      ],
    });

    expect(screen.getByText("카카오맵 검색 결과")).toBeTruthy();
    expect(screen.getByText("🔍 동반 가능 여부 확인 필요")).toBeTruthy();
    // 장소 줄엔 확정 배지를 달지 않는다(머리말의 코스 요약 배지 하나만 남는다).
    expect(onScreen("동반 가능")).toHaveLength(1);
  });
});

describe("순서 편집", () => {
  it("평소엔 손잡이를 감춰 둔다", () => {
    setup();

    expect(screen.queryByRole("button", { name: /순서 바꾸기/ })).toBeNull();
  });

  it("편집을 켜면 모든 일차에 손잡이를 붙인다", async () => {
    const { user } = setup({ nights: 1, days: [[한밭수목원], [시립미술관]] });

    await user.click(editToggle());

    expect(screen.getAllByRole("button", { name: /순서 바꾸기/ })).toHaveLength(2);
    expect(screen.getByText(/드래그하면 순서가 바뀌어요/)).toBeTruthy();
  });

  it("편집 중엔 동반 가능 태그를 접는다", async () => {
    const { user } = setup();
    // 머리말 요약 배지 1개 + 장소 2줄.
    expect(onScreen("동반 가능")).toHaveLength(3);

    await user.click(editToggle());

    expect(onScreen("동반 가능")).toHaveLength(1);
  });
});

describe("공유와 저장", () => {
  it("공유 문구에 박 수·테마를 모두 담는다", () => {
    setup({ theme: "문화", nights: 1, courseTitle: "대전 문화 코스" });

    expect(share.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fileName: "대저니유-대전 문화 코스",
        kakaoTitle: "대전 문화 코스",
        kakaoDescription: "1박 2일 · 문화형 코스 · 대저니유에서 만든 반려동물 여행 코스예요 🐾",
      })
    );
  });

  it("공유 카드는 화면 밖에 숨겨 두고 캡처할 때만 쓴다", () => {
    const { container } = setup({ theme: "문화" });
    const hidden = container.querySelector('[aria-hidden="true"]') as HTMLElement;

    expect(hidden.style.left).toBe("-9999px");
    // 티켓 카드 머리에 붙는 뱃지 — 화면 태그와 같은 정보를 다시 싣는다.
    expect(hidden.textContent).toContain("문화형");
  });

  it("저장 버튼이 코스를 보관함에 넣는다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(handlers.onSave).toHaveBeenCalledTimes(1);
  });

  it("저장하지 않고 홈으로 나갈 길도 둔다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "홈으로" }));

    expect(handlers.onGoHome).toHaveBeenCalledTimes(1);
  });
});
