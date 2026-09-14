import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DragReorderList } from "@/components/course/DragReorderList";

const ROW_HEIGHT = 60;

/**
 * jsdom에는 PointerEvent가 없어 fireEvent가 밋밋한 Event로 대체하고, 그 과정에서 clientY가
 * 사라진다 — 좌표가 없으면 이동 거리가 NaN이 되어 순서 바꾸기가 통째로 안 돈다.
 * MouseEvent를 상속해 좌표를 살린 최소 구현으로 대신한다.
 */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 1;
  }
}
vi.stubGlobal("PointerEvent", PointerEventPolyfill);

interface Stop {
  id: string;
  name: string;
}

const stops: Stop[] = [
  { id: "a", name: "한밭수목원" },
  { id: "b", name: "장태산" },
  { id: "c", name: "대청호" },
];

/**
 * jsdom은 레이아웃을 계산하지 않아 getBoundingClientRect가 전부 0이다.
 * 카드 높이로 몇 칸 옮겼는지 정하는 컴포넌트라, 높이를 고정값으로 흉내 낸다.
 */
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    height: ROW_HEIGHT,
    width: 300,
    top: 0,
    left: 0,
    right: 300,
    bottom: ROW_HEIGHT,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  // 포인터 캡처는 jsdom에 없다 — 드래그 로직과 무관하므로 빈 함수로 둔다.
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    value: vi.fn(),
    configurable: true,
  });
});

function setup(items = stops) {
  const onReorder = vi.fn();
  render(
    <DragReorderList
      items={items}
      getId={(item) => item.id}
      onReorder={onReorder}
      renderRow={(item, index, ref, dragHandleProps) => (
        <div ref={ref} data-testid={`row-${item.id}`}>
          <span>{`${index + 1}. ${item.name}`}</span>
          <button type="button" aria-label={`${item.name} 순서 바꾸기`} {...dragHandleProps} />
        </div>
      )}
    />
  );
  return { onReorder };
}

function handle(name: string): HTMLElement {
  return screen.getByRole("button", { name: `${name} 순서 바꾸기` });
}

/** 손잡이를 잡고 dy픽셀만큼 끌었다 놓는다. */
function drag(name: string, dy: number) {
  const target = handle(name);
  fireEvent.pointerDown(target, { clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(target, { clientY: 100 + dy, pointerId: 1 });
  fireEvent.pointerUp(target, { pointerId: 1 });
}

describe("DragReorderList", () => {
  it("받은 순서대로 행을 그린다", () => {
    setup();

    expect(screen.getByText("1. 한밭수목원")).toBeTruthy();
    expect(screen.getByText("3. 대청호")).toBeTruthy();
  });

  it("한 칸 아래로 끌면 뒤 항목과 자리를 바꾼다", () => {
    const { onReorder } = setup();

    drag("한밭수목원", ROW_HEIGHT);

    expect(onReorder).toHaveBeenCalledWith([
      { id: "b", name: "장태산" },
      { id: "a", name: "한밭수목원" },
      { id: "c", name: "대청호" },
    ]);
  });

  it("한 칸 위로도 옮긴다", () => {
    const { onReorder } = setup();

    drag("대청호", -ROW_HEIGHT);

    expect(onReorder).toHaveBeenCalledWith([
      { id: "a", name: "한밭수목원" },
      { id: "c", name: "대청호" },
      { id: "b", name: "장태산" },
    ]);
  });

  it("두 칸을 한 번에 끌어도 정확히 그 자리로 간다", () => {
    const { onReorder } = setup();

    drag("한밭수목원", ROW_HEIGHT * 2);

    expect(onReorder).toHaveBeenLastCalledWith([
      { id: "b", name: "장태산" },
      { id: "c", name: "대청호" },
      { id: "a", name: "한밭수목원" },
    ]);
  });

  it("반 칸을 못 넘기면 순서를 바꾸지 않는다", () => {
    const { onReorder } = setup();

    drag("한밭수목원", ROW_HEIGHT * 0.4);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("목록 밖으로 끌어도 범위 안에서 멈춘다 — 첫 항목을 위로", () => {
    const { onReorder } = setup();

    drag("한밭수목원", -ROW_HEIGHT * 5);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("목록 밖으로 끌어도 범위 안에서 멈춘다 — 마지막 항목을 아래로", () => {
    const { onReorder } = setup();

    drag("대청호", ROW_HEIGHT * 5);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("아주 멀리 끌면 맨 끝까지만 간다", () => {
    const { onReorder } = setup();

    drag("한밭수목원", ROW_HEIGHT * 10);

    expect(onReorder).toHaveBeenLastCalledWith([
      { id: "b", name: "장태산" },
      { id: "c", name: "대청호" },
      { id: "a", name: "한밭수목원" },
    ]);
  });

  it("잡지 않은 채 움직이면 아무 일도 없다", () => {
    const { onReorder } = setup();

    fireEvent.pointerMove(handle("한밭수목원"), { clientY: 500, pointerId: 1 });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("드래그를 놓으면 들어올린 스타일을 원래대로 되돌린다", () => {
    setup();
    const row = screen.getByTestId("row-a");

    fireEvent.pointerDown(handle("한밭수목원"), { clientY: 100, pointerId: 1 });
    expect(row.style.boxShadow).not.toBe("");

    fireEvent.pointerUp(handle("한밭수목원"), { pointerId: 1 });
    expect(row.style.boxShadow).toBe("");
    expect(row.style.transform).toBe("");
  });

  it("드래그가 취소돼도 스타일을 되돌린다 — 전화가 오면 pointercancel이 온다", () => {
    setup();
    const row = screen.getByTestId("row-a");

    fireEvent.pointerDown(handle("한밭수목원"), { clientY: 100, pointerId: 1 });
    fireEvent.pointerCancel(handle("한밭수목원"), { pointerId: 1 });

    expect(row.style.boxShadow).toBe("");
  });

  it("항목이 하나뿐이면 끌어도 바뀌지 않는다", () => {
    const { onReorder } = setup([stops[0]]);

    drag("한밭수목원", ROW_HEIGHT * 3);

    expect(onReorder).not.toHaveBeenCalled();
  });
});
