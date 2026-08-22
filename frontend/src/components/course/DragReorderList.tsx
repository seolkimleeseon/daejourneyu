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

/** 코스 동선 순서를 포인터 드래그로 바꾸는 공용 로직. 코스 상세 편집(DayStops)과 같은 방식 —
 * 드래그 중인 항목이 다른 항목의 세로 중점을 넘어가면 그 자리로 스왑한다. */
export function DragReorderList<T>({ items, getId, onReorder, renderRow }: DragReorderListProps<T>) {
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handlePointerDown = (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDraggingId(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingId) return;
    const pointerY = event.clientY;
    const currentIndex = items.findIndex((item) => getId(item) === draggingId);
    if (currentIndex === -1) return;
    for (let i = 0; i < items.length; i++) {
      if (i === currentIndex) continue;
      const el = rowRefs.current[getId(items[i])];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const crossing = (i < currentIndex && pointerY < mid) || (i > currentIndex && pointerY > mid);
      if (crossing) {
        const next = [...items];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(i, 0, moved);
        onReorder(next);
        break;
      }
    }
  };

  const handlePointerUp = () => setDraggingId(null);

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
