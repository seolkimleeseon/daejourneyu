import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSheetStore } from "@/stores/useSheetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePlace } from "@/test/fixtures";
import type { Place } from "@/types";
import { PlacesStep } from "./PlacesStep";

const 한밭수목원 = makePlace({ id: "p1", name: "한밭수목원", district: "서구", category: "산책" });
const 댕댕카페 = makePlace({ id: "p2", name: "댕댕카페", district: "유성구", category: "맛집" });
const 시립미술관 = makePlace({ id: "p3", name: "시립미술관", district: "서구", category: "문화" });

const handlers = {
  onSetActiveDay: vi.fn(),
  onSetStart: vi.fn(),
  onRemove: vi.fn(),
  onApplyPicked: vi.fn(),
  onNext: vi.fn(),
};

function setup(props: Partial<React.ComponentProps<typeof PlacesStep>> = {}) {
  const view = render(
    <PlacesStep
      days={[[한밭수목원, 댕댕카페]]}
      startIds={{}}
      activeDay={0}
      {...handlers}
      {...props}
    />
  );
  return { ...view, user: userEvent.setup() };
}

/**
 * 담은 장소 한 줄. 시작점 안내 배너에도 같은 이름이 나오므로 목록 카드 안에서만 찾는다.
 */
function row(name: string): HTMLElement {
  const list = document.querySelector("div.mb-3.overflow-hidden.rounded-xl") as HTMLElement;
  return Array.from(list.children).find((child) => child.textContent?.includes(name)) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  useSheetStore.setState({ isOpen: false, title: "", selected: [], onDone: null });
  useToastStore.setState({ message: null, key: 0 });
});

describe("일차 탭", () => {
  it("하루짜리면 탭을 두지 않는다 — 고를 게 하나뿐이다", () => {
    setup();

    expect(screen.queryByRole("button", { name: /1일차/ })).toBeNull();
  });

  it("여러 날이면 일차마다 담은 개수를 함께 보여준다", () => {
    setup({ days: [[한밭수목원, 댕댕카페], [시립미술관]] });

    expect(screen.getByRole("button", { name: "1일차 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2일차 1" })).toBeTruthy();
  });

  it("탭을 누르면 그 일차로 옮긴다", async () => {
    const { user } = setup({ days: [[한밭수목원], [시립미술관]] });

    await user.click(screen.getByRole("button", { name: /2일차/ }));

    expect(handlers.onSetActiveDay).toHaveBeenCalledWith(1);
  });
});

describe("담은 목록", () => {
  it("지금 일차에 담은 곳만 개수와 함께 보여준다", () => {
    setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });

    expect(screen.getByText("시립미술관")).toBeTruthy();
    expect(screen.queryByText("한밭수목원")).toBeNull();
    expect(screen.getByText("1곳")).toBeTruthy();
  });

  it("비어 있으면 빈 칸 대신 무엇을 하라는지 적는다", () => {
    setup({ days: [[]] });

    expect(screen.getByText("담은 곳이 비어 있어요")).toBeTruthy();
  });

  it("여러 날이면 비어 있는 게 몇 일차인지 짚어준다", () => {
    setup({ days: [[한밭수목원], []], activeDay: 1 });

    expect(screen.getByText("2일차가 비어 있어요")).toBeTruthy();
  });

  it("장소마다 구와 분류를 함께 적는다", () => {
    setup({ days: [[댕댕카페]] });

    expect(screen.getByText("유성구 · 맛집")).toBeTruthy();
  });

  it("확정된 조건이면 동반 가능 여부를 그대로 단다", () => {
    setup({ days: [[makePlace({ id: "x", name: "출입금지공원", petFriendly: false })]] });

    expect(screen.getByText("🚫 동반 불가")).toBeTruthy();
  });

  it("확인이 필요한 조건이면 '동반 가능'이라 단정하지 않고 출처와 안내로 쪼갠다", () => {
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
    expect(screen.queryByText("🐾 동반 가능")).toBeNull();
  });
});

describe("시작점", () => {
  it("아직 안 골랐으면 골라 달라고 한다", () => {
    const { container } = setup();

    expect(container.textContent).toContain("여행을 시작할 기준 지점을 골라주세요");
  });

  it("고른 시작점의 이름을 짚어 알려준다", () => {
    const { container } = setup({ startIds: { 0: "p2" } });

    expect(container.textContent).toContain("댕댕카페에서 여행을 시작해요");
    expect(within(row("댕댕카페")).getByText("시작점")).toBeTruthy();
  });

  it("여러 날이면 몇 일차 시작인지도 밝힌다", () => {
    const { container } = setup({
      days: [[한밭수목원], [시립미술관]],
      activeDay: 1,
      startIds: { 1: "p3" },
    });

    expect(container.textContent).toContain("시립미술관에서 2일차 여행을 시작해요");
  });

  it("담긴 목록에 없는 시작점은 무시한다 — 지운 장소가 시작점으로 남아 있을 수 있다", () => {
    const { container } = setup({ startIds: { 0: "사라진-장소" } });

    expect(container.textContent).toContain("기준 지점을 골라주세요");
  });

  it("줄을 누르면 그 장소를 시작점으로 삼는다", async () => {
    const { user } = setup();

    await user.click(screen.getByText("댕댕카페"));

    expect(handlers.onSetStart).toHaveBeenCalledWith(0, "p2");
  });
});

describe("빼기", () => {
  it("✕로 그 장소만 뺀다", async () => {
    const { user } = setup();

    await user.click(within(row("댕댕카페")).getByRole("button", { name: "✕" }));

    expect(handlers.onRemove).toHaveBeenCalledWith(0, "p2");
  });

  it("✕는 시작점 지정으로 번지지 않는다 — 지우려다 시작점이 바뀌면 안 된다", async () => {
    const { user } = setup();

    await user.click(within(row("댕댕카페")).getByRole("button", { name: "✕" }));

    expect(handlers.onSetStart).not.toHaveBeenCalled();
  });
});

describe("장소 담기 시트", () => {
  it("지금 일차에 담긴 장소를 고른 상태로 시트를 연다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    const sheet = useSheetStore.getState();
    expect(sheet.isOpen).toBe(true);
    expect(sheet.title).toBe("담을 장소 고르기");
    expect(sheet.selected).toEqual([한밭수목원, 댕댕카페]);
  });

  it("여러 날이면 어느 일차에 담는 건지 제목에 밝힌다", async () => {
    const { user } = setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });

    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    expect(useSheetStore.getState().title).toBe("2일차에 담을 장소");
  });

  it("고르고 닫으면 그 일차에 반영한다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    useSheetStore.getState().onDone?.([한밭수목원, 시립미술관]);

    expect(handlers.onApplyPicked).toHaveBeenCalledWith(0, [한밭수목원, 시립미술관]);
  });

  it("다른 일차에 이미 담긴 곳은 빼고, 뺐다는 걸 알린다 — 같은 곳을 이틀 연속 가진 않는다", async () => {
    const { user } = setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    useSheetStore.getState().onDone?.([시립미술관, 한밭수목원]);

    expect(handlers.onApplyPicked).toHaveBeenCalledWith(1, [시립미술관]);
    expect(useToastStore.getState().message).toBe("다른 일차에 이미 담긴 장소는 제외했어요");
  });

  it("겹치는 곳이 없으면 괜히 알리지 않는다", async () => {
    const { user } = setup({ days: [[한밭수목원], [시립미술관]], activeDay: 1 });
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    useSheetStore.getState().onDone?.([시립미술관, 댕댕카페]);

    expect(useToastStore.getState().message).toBeNull();
  });

  it("id가 달라도 이름이 같으면 같은 곳으로 본다 — 카카오와 공공데이터에 같은 곳이 따로 있다", async () => {
    const kakao한밭: Place = { ...한밭수목원, id: "kakao-99" };
    const { user } = setup({ days: [[한밭수목원], []], activeDay: 1 });
    await user.click(screen.getByRole("button", { name: /장소 추가하기/ }));

    useSheetStore.getState().onDone?.([kakao한밭]);

    expect(handlers.onApplyPicked).toHaveBeenCalledWith(1, []);
  });
});

describe("다음으로", () => {
  it("한 곳이라도 담으면 동선 확인으로 넘어간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "최적 동선 확인하기" }));

    expect(handlers.onNext).toHaveBeenCalledTimes(1);
  });

  it("아무것도 없으면 막고 이유를 적는다", () => {
    setup({ days: [[]] });

    expect(screen.getByRole("button", { name: "최적 동선 확인하기" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("장소를 1곳 이상 담아주세요")).toBeTruthy();
  });

  it("한 일차만 비어도 막는다 — 빈 일차로 코스를 저장하면 안 된다", () => {
    setup({ days: [[한밭수목원], []] });

    expect(screen.getByRole("button", { name: "최적 동선 확인하기" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("비어 있는 일차가 있어요")).toBeTruthy();
  });

  it("모든 일차가 차 있으면 사유 문구를 지운다", () => {
    setup({ days: [[한밭수목원], [시립미술관]] });

    expect(screen.queryByText(/비어 있는 일차/)).toBeNull();
  });
});
