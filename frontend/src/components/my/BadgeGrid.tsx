"use client";

import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/cn";

/** 4열 그리드라 8개면 정확히 두 줄. 뱃지가 늘어도 마이탭이 세로로 길어지지 않게 여기서 자른다. */
const SUMMARY_LIMIT = 8;

interface BadgeGridProps {
  badges: Badge[];
  onOpenAll: () => void;
}

/**
 * 마이탭의 뱃지 요약. 답하는 질문은 하나다 — **"내가 어디까지 왔나"**.
 *
 * 획득분과 미획득분을 두 섹션으로 갈라놓지 않는다. 나눠보니 한 컬렉션이 아니라 서로 다른 두
 * 목록으로 읽혔다. 같은 그리드에 두고 상태는 뱃지 자체의 색으로만 구분한다.
 *
 * 자물쇠로 덮지 않는 것도 같은 이유다 — 무슨 뱃지인지 보여야 해볼 만한 것으로 읽히고,
 * 다음 보상까지 남은 거리가 보여야 목표 구배(goal gradient)로 얻는 동기부여가 살아난다.
 *
 * "뭘 하면 받나"는 이 그리드가 답하지 않는다. 4열 타일에는 획득 조건이 들어갈 자리가 없어
 * 전체 목록 화면(/my/badges)이 계열별 섹션과 함께 담당한다.
 */
export function BadgeGrid({ badges, onOpenAll }: BadgeGridProps) {
  const gotCount = badges.filter((badge) => badge.got).length;
  // 획득분을 앞으로 당긴다 — 뱃지가 늘어 앞 8칸만 남더라도 모은 것이 먼저 보여야 한다.
  const visible = [...badges]
    .sort((a, b) => Number(b.got) - Number(a.got))
    .slice(0, SUMMARY_LIMIT);

  return (
    <div>
      <div className="mb-2 mt-1 flex items-center justify-between px-1">
        <div className="flex items-baseline gap-1.5 text-xs font-bold text-ink-muted">
          <span>내 여행 뱃지</span>
          <span className="text-brand-700">
            {gotCount}/{badges.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="text-[11px] font-bold text-brand-700 active:opacity-60"
        >
          전체 보기 ›
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {visible.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "rounded-xl border px-1 pb-2.5 pt-3 text-center",
              badge.got ? "border-brand-300 bg-brand-100" : "border-dashed border-line-strong"
            )}
          >
            <div className={cn("mb-1 text-[22px] leading-none", !badge.got && "opacity-40 grayscale")}>
              {badge.emoji}
            </div>
            <div className={cn("text-[9px] font-extrabold", !badge.got && "text-ink-muted")}>
              {badge.name}
            </div>
            <div className="mt-0.5 text-[8px] leading-tight text-ink-muted">
              {badge.description}
            </div>
          </div>
        ))}
      </div>

      {gotCount === badges.length ? (
        <p className="mt-2.5 text-center text-[11px] font-bold text-brand-700">
          🎉 뱃지를 모두 모았어요!
        </p>
      ) : null}
    </div>
  );
}
