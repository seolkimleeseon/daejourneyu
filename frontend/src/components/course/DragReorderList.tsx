"use client";

import { Fragment, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export interface DragHandleProps {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

interface DragReorderListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  /** ref는 caller가 자기 row 엘리먼트에 직접 달아야 한다 — 래핑 div를 추가하지 않아
   * border-b/last:border-b-0 같은 리스트 스타일이 그대로 유지된다. */
  renderRow: (item: T, index: number, ref: (el: HTMLDivElement | null) => void, dragHandleProps: DragHandleProps) => ReactNode;
}

/**
 * 코스 동선 순서를 포인터 드래그로 바꾸는 공용 로직.
 * 드래그 중인 카드를 포인터를 따라 들어올리고(translateY + 그림자), 몇 칸 옮겼는지는
 * "드래그 시작점 대비 이동거리 ÷ 카드 높이"를 매번 새로 계산해서 정한다 — 스왑마다 기준점을
 * 조금씩 보정해나가는 방식은 오차가 누적돼서 카드가 다른 카드와 겹쳐버리는 버그가 있었다.
 * 항상 "시작 위치 + 지금까지 이동한 칸 수"로 고정 계산하면 어떤 경우에도 어긋나지 않는다.
 */
export function DragReorderList<T>({ items, getId, onReorder, renderRow }: DragReorderListProps<T>) {
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const originYRef = useRef(0);
  const rowHeightRef = useRef(0);
  /** 드래그 시작 시점에 이 카드가 있던 인덱스. 드래그 내내 고정값이고, 지금 위치는 항상
   * startIndex + stepsRef로만 구한다(중간 상태를 따로 추적하지 않는다). */
  const startIndexRef = useRef(0);
  /** 지금까지 옮긴 칸 수(음수면 위로, 양수면 아래로). */
  const stepsRef = useRef(0);
  /** pointermove는 리액트 리렌더보다 훨씬 자주 발생할 수 있어서, 매번 최신 순서를 확실히
   * 참조하려고 prop 대신 이 ref를 쓴다(리렌더 여부와 무관하게 즉시 갱신됨). */
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const liftRow = (id: string) => {
    const el = rowRefs.current[id];
    if (!el) return;
    rowHeightRef.current = el.getBoundingClientRect().height;
    el.style.position = "relative";
    el.style.zIndex = "20";
    el.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.18)";
    el.style.transition = "none";
    el.style.willChange = "transform";
  };

  const dropRow = (id: string | null) => {
    if (!id) return;
    const el = rowRefs.current[id];
    if (!el) return;
    el.style.transform = "";
    el.style.zIndex = "";
    el.style.boxShadow = "";
    el.style.position = "";
    el.style.willChange = "";
    el.style.transition = "";
  };

  const handlePointerDown = (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startIndexRef.current = itemsRef.current.findIndex((item) => getId(item) === id);
    stepsRef.current = 0;
    setDraggingId(id);
    originYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
    liftRow(id);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingId) return;
    const draggedEl = rowRefs.current[draggingId];
    if (!draggedEl) return;

    const rowHeight = rowHeightRef.current || 1;
    const startIndex = startIndexRef.current;
    const total = itemsRef.current.length;
    const rawDelta = event.clientY - originYRef.current;
    const minDelta = -startIndex * rowHeight;
    const maxDelta = (total - 1 - startIndex) * rowHeight;
    const delta = Math.min(maxDelta, Math.max(minDelta, rawDelta));

    const steps = Math.round(delta / rowHeight);
    // 아직 안 옮겨간 "덜 스냅된 만큼"만 시각적으로 더해서, 카드가 스냅 직전까지 포인터를 부드럽게 따라오게 한다.
    draggedEl.style.transform = `translateY(${delta - steps * rowHeight}px)`;

    if (steps !== stepsRef.current) {
      const currentIndex = startIndex + stepsRef.current;
      const targetIndex = startIndex + steps;
      const list = itemsRef.current;
      if (currentIndex >= 0 && currentIndex < list.length && targetIndex >= 0 && targetIndex < list.length) {
        const next = [...list];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, moved);
        itemsRef.current = next;
        onReorder(next);
      }
      stepsRef.current = steps;
    }
  };

  const handlePointerUp = () => {
    dropRow(draggingId);
    stepsRef.current = 0;
    setDraggingId(null);
  };

  return (
    <>
      {items.map((item, index) => {
        const id = getId(item);
        return (
          <Fragment key={id}>
            {renderRow(
              item,
              index,
              (el) => {
                rowRefs.current[id] = el;
              },
              {
                onPointerDown: handlePointerDown(id),
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerUp,
                onPointerCancel: handlePointerUp,
              }
            )}
          </Fragment>
        );
      })}
    </>
  );
}
