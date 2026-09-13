"use client";

import type { Badge } from "@/lib/badges";

interface BadgeNearlineProps {
  badge: Badge | null;
  message: string;
  onGo: (href: string) => void;
}

/**
 * 뱃지 요약 그리드 위에 붙는 '남은 거리' 한 줄.
 *
 * 목표에 가까울수록 행동이 빨라지므로(goal gradient) 코앞인 것 하나를 문장으로 말해준다.
 * 마이탭에 새로 들어가는 유일한 요소이고, 지도 카드 같은 큰 블록을 얹지 않는 이유는 두 가지다 —
 * 마이탭이 이미 여권 + 그리드 + 메뉴로 꽉 차 있고, 같은 뱃지가 아래 그리드에 타일로 또 나오기
 * 때문에 블록을 더하면 같은 말을 두 번 하게 된다.
 *
 * 코앞인 뱃지가 없으면 아무것도 그리지 않는다. "아직 멀었어요" 같은 빈 상태를 늘 띄워두면
 * 벽지가 되어 무시당하고, 없을 때 사라져야 떴을 때 의미가 생긴다.
 *
 * 여러 개가 진행 중이어도 한 줄만 띄운다 — 쌓으면 방금 피한 블록만큼 무거워진다.
 * 어느 하나를 고르는 규칙은 `pickNearestBadge` 주석 참고.
 */
export function BadgeNearline({ badge, message, onGo }: BadgeNearlineProps) {
  if (!badge) return null;

  const href = badge.href;

  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-brand-300 bg-brand-100 px-2.5 py-2">
      <span className="min-w-0 text-[11px] font-bold text-brand-700">
        <span aria-hidden="true">{badge.emoji} </span>
        {message}
      </span>
      {href ? (
        <button
          type="button"
          onClick={() => onGo(href)}
          className="shrink-0 text-[11px] font-bold text-brand-700 active:opacity-60"
        >
          보러 가기 ›
        </button>
      ) : null}
    </div>
  );
}
