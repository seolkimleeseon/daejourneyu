"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const ACTION_WIDTH = 84;
/** 이 거리(px) 넘게 움직여야 스와이프인지 세로 스크롤인지 가른다 — 가벼운 손떨림은 무시한다. */
const DECIDE_DISTANCE = 8;

interface SwipeToDeleteRowProps {
  children: ReactNode;
  onDelete: () => void;
  /** 카드 아래 마진(px)만큼 삭제 버튼 높이를 줄여 카드와 높이를 맞춘다. */
  bottomGap?: number;
}

/**
 * 카드를 왼쪽으로 밀면 삭제 버튼이 나오는 iOS식 행.
 * 세로 스크롤은 그대로 두려고(touch-action: pan-y) 가로로 더 많이 움직였을 때만 스와이프로 취급하고,
 * 스와이프한 직후에 따라오는 click은 삼켜서 카드 클릭(상세 이동)이 같이 터지지 않게 한다.
 * 마우스로도 끌어서 열 수 있다 — 다만 발견하기 어려우니 카드 쪽에 휴지통 아이콘도 함께 둔다.
 */
export function SwipeToDeleteRow({ children, onDelete, bottomGap = 14 }: SwipeToDeleteRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const startRef = useRef<{ x: number; y: number; offset: number } | null>(null);
  const modeRef = useRef<"idle" | "swipe" | "scroll">("idle");
  const movedRef = useRef(false);

  const apply = (next: number) => {
    offsetRef.current = next;
    setOffset(next);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    startRef.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current };
    modeRef.current = "idle";
    movedRef.current = false;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = startRef.current;
    if (!start || modeRef.current === "scroll") return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (modeRef.current === "idle") {
      if (Math.abs(dx) > DECIDE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
        modeRef.current = "swipe";
        setDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } else if (Math.abs(dy) > DECIDE_DISTANCE) {
        modeRef.current = "scroll";
        return;
      } else {
        return;
      }
    }

    movedRef.current = true;
    apply(Math.min(0, Math.max(-ACTION_WIDTH, start.offset + dx)));
  };

  const finishPointer = () => {
    if (modeRef.current === "swipe") {
      apply(offsetRef.current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
    }
    startRef.current = null;
    modeRef.current = "idle";
    setDragging(false);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      movedRef.current = false;
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    // 열린 상태에서 카드를 누르면 상세로 가지 않고 먼저 닫는다.
    if (offsetRef.current !== 0) {
      event.stopPropagation();
      event.preventDefault();
      apply(0);
    }
  };

  const isOpen = offset !== 0;

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => {
          apply(0);
          onDelete();
        }}
        // 닫혀 있을 땐 카드의 둥근 모서리 뒤로 주황색이 비쳐 보이지 않게 투명하게 둔다.
        style={{ width: ACTION_WIDTH, bottom: bottomGap, opacity: isOpen ? 1 : 0, transition: "opacity 200ms" }}
        className="absolute right-0 top-0 rounded-r-2xl bg-accent-coral text-sm font-bold text-white"
      >
        삭제
      </button>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onClickCapture={handleClickCapture}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 200ms ease",
        }}
        className="relative touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
}
