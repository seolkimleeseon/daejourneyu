import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makePlace } from "@/test/fixtures";
import { ReviewStep } from "./ReviewStep";

/** 지도는 카카오 SDK가 있어야 그려진다 — 몇 곳을 넘겼는지만 남기고 비운다. */
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

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원", district: "서구", lat: 36.36, lng: 127.38 });
const 댕댕카페 = makePlace({ id: "p2", name: "댕댕카페", district: "유성구", category: "맛집", lat: 36.36, lng: 127.38 });
const 시립미술관 = makePlace({ id: "p3", name: "시립미술관", district: "서구", category: "문화", lat: 36.5, lng: 127.5 });

const handlers = { onSetActiveDay: vi.fn(), onReorderDay: vi.fn(), onChangeName: vi.fn(), onSave: vi.fn() };

function setup(props: Partial<React.ComponentProps<typeof ReviewStep>> = {}) {
  const view = render(
    <ReviewStep
      days={[[한밭수목원, 댕댕카페]]}
      activeDay={0}
      name=""
      defaultName="나의 대전 코스"
      {...handlers}
      {...props}
    />
  );
  return { ...view, user: userEvent.setup() };
}

const editToggle = () => screen.getByRole("button", { name: /순서 편집|✓ 완료/ });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("동선 요약", () => {
  it("어떻게 순서를 정했는지 먼저 밝힌다", () => {
    const { container } = setup();

    expect(container.textContent).toContain("시작 지점 기준으로 가까운 곳끼리 이어 최적 동선을 짰어요");
  });

  it("곳 수와 총 이동 거리를 함께 적는다", () => {
    setup();

    // 두 곳의 좌표가 같으니 이동 거리는 0이다.
    expect(screen.getByText("동선 · 2곳 · 0.0km")).toBeTruthy();
  });

  it("멀리 떨어진 곳이 섞이면 거리도 그만큼 늘어난다", () => {
    setup({ days: [[한밭수목원, 시립미술관]] });

    expect(screen.getByText(/동선 · 2곳 · 1[0-9.]+km/)).toBeTruthy();
  });

  it("여러 날이면 몇 일차 동선인지 밝힌다", () => {
    setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });

    expect(screen.getByText(/^2일차 동선 · 1곳/)).toBeTruthy();
  });

  it("일차 탭으로 다른 날 동선을 본다", async () => {
    const { user } = setup({ days: [[한밭수목원], [시립미술관]] });

    await user.click(screen.getByRole("button", { name: "2일차" }));

    expect(handlers.onSetActiveDay).toHaveBeenCalledWith(1);
  });

  it("지도에는 지금 보고 있는 일차만 꽂는다", () => {
    setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });

    expect(map.render).toHaveBeenLastCalledWith([시립미술관]);
  });

  it("빈 일차에는 지도를 띄우지 않는다 — 꽂을 핀이 없다", () => {
    setup({ days: [[]] });

    expect(screen.queryByTestId("route-map")).toBeNull();
  });
});

describe("순서 편집", () => {
  it("평소엔 손잡이를 감춰 둔다 — 읽으러 온 화면이다", () => {
    setup();

    expect(screen.queryByRole("button", { name: /순서 바꾸기/ })).toBeNull();
  });

  it("편집을 켜면 장소마다 손잡이와 사용법을 붙인다", async () => {
    const { user } = setup();

    await user.click(editToggle());

    expect(screen.getAllByRole("button", { name: /순서 바꾸기/ })).toHaveLength(2);
    expect(screen.getByText(/드래그하면 순서가 바뀌어요/)).toBeTruthy();
  });

  it("편집 중엔 동반 가능 태그를 접는다 — 손잡이와 같이 두면 줄이 복잡해진다", async () => {
    const { user } = setup();
    expect(screen.getAllByText("동반 가능")).toHaveLength(2);

    await user.click(editToggle());

    expect(screen.queryByText("동반 가능")).toBeNull();
  });

  it("다시 누르면 편집을 끝낸다", async () => {
    const { user } = setup();

    await user.click(editToggle());
    await user.click(editToggle());

    expect(screen.queryByRole("button", { name: /순서 바꾸기/ })).toBeNull();
  });
});

describe("코스 이름", () => {
  it("이름을 치면 그대로 알린다", async () => {
    const { user } = setup();

    await user.type(screen.getByPlaceholderText("나의 대전 코스"), "가");

    expect(handlers.onChangeName).toHaveBeenCalledWith("가");
  });

  it("비워두면 기본 이름으로 저장된다고 미리 알린다", () => {
    const { container } = setup();

    expect(container.textContent).toContain("이름을 비워두면 나의 대전 코스로 저장돼요");
  });

  it("공백만 친 이름은 안 쓴 것으로 보고 기본 이름을 공유에 쓴다", () => {
    setup({ name: "   " });

    expect(share.render).toHaveBeenLastCalledWith(
      expect.objectContaining({ kakaoTitle: "나의 대전 코스" })
    );
  });

  it("이름을 지으면 공유 제목과 파일명에 그 이름을 쓴다", () => {
    setup({ name: "유성 산책 코스" });

    expect(share.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kakaoTitle: "유성 산책 코스",
        fileName: "대저니유-유성 산책 코스",
        kakaoDescription: "2곳 · 대저니유에서 직접 지은 반려동물 여행 코스예요 🐾",
      })
    );
  });
});

describe("공유 카드", () => {
  it("화면 밖에 숨겨 두고 캡처할 때만 쓴다", () => {
    const { container } = setup({ name: "유성 산책 코스" });
    const hidden = container.querySelector('[aria-hidden="true"]') as HTMLElement;

    expect(hidden.style.left).toBe("-9999px");
    expect(hidden.textContent).toContain("유성 산책 코스");
  });

  it("캡처 대상은 화면이 아니라 그 공유 카드다", () => {
    setup();
    const captureRef = share.render.mock.lastCall?.[0].captureRef as { current: HTMLElement };

    expect(captureRef.current.textContent).toContain("DAEJOURNEYU");
    expect(captureRef.current.textContent).not.toContain("최적 동선을 짰어요");
  });
});

describe("저장", () => {
  it("저장 버튼이 코스를 보관함에 넣는다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "코스 저장하기" }));

    expect(handlers.onSave).toHaveBeenCalledTimes(1);
  });
});
