import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SwipeToDeleteRow } from "@/components/course/SwipeToDeleteRow";

/** jsdom엔 PointerEvent가 없어 좌표가 사라진다 — MouseEvent를 상속해 clientX/Y를 살린다. */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 1;
  }
}
vi.stubGlobal("PointerEvent", PointerEventPolyfill);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { value: vi.fn(), configurable: true });
});

function setup() {
  const onDelete = vi.fn();
  const onCardClick = vi.fn();
  render(
    <SwipeToDeleteRow onDelete={onDelete}>
      <div data-testid="card" onClick={onCardClick}>
        카드
      </div>
    </SwipeToDeleteRow>
  );
  // 스와이프 대상은 카드를 감싼 이동 div다.
  const track = screen.getByTestId("card").parentElement as HTMLElement;
  return { onDelete, onCardClick, track };
}

function swipe(track: HTMLElement, from: [number, number], to: [number, number]) {
  fireEvent.pointerDown(track, { clientX: from[0], clientY: from[1] });
  fireEvent.pointerMove(track, { clientX: to[0], clientY: to[1] });
  fireEvent.pointerUp(track, { clientX: to[0], clientY: to[1] });
}

describe("SwipeToDeleteRow", () => {
  it("절반 넘게 왼쪽으로 밀면 삭제 버튼이 열린 채로 멈춘다", () => {
    const { track } = setup();

    swipe(track, [200, 10], [120, 12]);

    expect(track.style.transform).toBe("translateX(-84px)");
    expect(screen.getByRole("button", { name: "삭제" })).toBeTruthy();
  });

  it("조금만 밀면 도로 닫힌다", () => {
    const { track } = setup();

    swipe(track, [200, 10], [170, 10]);

    expect(track.style.transform).toBe("translateX(0px)");
  });

  it("세로로 더 움직이면 스와이프가 아니라 스크롤로 보고 열지 않는다", () => {
    const { track } = setup();

    swipe(track, [200, 10], [170, 90]);

    expect(track.style.transform).toBe("translateX(0px)");
  });

  it("오른쪽으로는 밀리지 않는다", () => {
    const { track } = setup();

    swipe(track, [100, 10], [220, 10]);

    expect(track.style.transform).toBe("translateX(0px)");
  });

  it("스와이프 직후의 클릭은 카드 클릭으로 새어 나가지 않는다", () => {
    const { track, onCardClick } = setup();

    swipe(track, [200, 10], [120, 10]);
    fireEvent.click(screen.getByTestId("card"));

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("그냥 누르면 카드 클릭이 그대로 동작한다", () => {
    const { track, onCardClick } = setup();

    fireEvent.pointerDown(track, { clientX: 100, clientY: 10 });
    fireEvent.pointerUp(track, { clientX: 100, clientY: 10 });
    fireEvent.click(screen.getByTestId("card"));

    expect(onCardClick).toHaveBeenCalledTimes(1);
  });

  it("열려 있는 카드를 누르면 상세로 가지 않고 닫힌다", () => {
    const { track, onCardClick } = setup();
    swipe(track, [200, 10], [120, 10]);
    fireEvent.click(screen.getByTestId("card")); // 스와이프 직후 클릭(삼켜짐)

    fireEvent.pointerDown(track, { clientX: 50, clientY: 10 });
    fireEvent.pointerUp(track, { clientX: 50, clientY: 10 });
    fireEvent.click(screen.getByTestId("card"));

    expect(onCardClick).not.toHaveBeenCalled();
    expect(track.style.transform).toBe("translateX(0px)");
  });

  it("삭제 버튼을 누르면 onDelete를 부르고 행을 닫는다", () => {
    const { track, onDelete } = setup();
    swipe(track, [200, 10], [120, 10]);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(track.style.transform).toBe("translateX(0px)");
  });
});
