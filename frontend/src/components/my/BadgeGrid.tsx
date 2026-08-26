import type { Badge } from "@/lib/badges";

interface BadgeGridProps {
  /** 획득한 뱃지만 넘긴다 — 잠긴 칸은 전체 목록 화면(/my/badges)이 담당한다. */
  badges: Badge[];
  total: number;
  onSeeAll: () => void;
}

/**
 * 마이탭의 뱃지 요약. 자물쇠로 빈 칸을 채우면 "내 뱃지"가 아니라 카탈로그처럼 보여서,
 * 여기서는 획득한 것만 보여주고 못 얻은 것은 전체 목록에서 확인하게 한다.
 */
export function BadgeGrid({ badges, total, onSeeAll }: BadgeGridProps) {
  return (
    <div>
      <div className="mb-2 mt-1 flex items-center justify-between px-1 text-xs font-bold text-ink-muted">
        <span>내 여행 뱃지</span>
        <button type="button" onClick={onSeeAll} className="text-brand-700 active:opacity-55">
          {badges.length}/{total} ›
        </button>
      </div>

      {badges.length === 0 ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full rounded-xl border border-dashed border-line-strong px-3 py-5 text-center active:bg-surface"
        >
          <div className="text-[22px] leading-none">🐾</div>
          <div className="mt-1.5 text-[11px] font-bold text-ink">아직 모은 뱃지가 없어요</div>
          <div className="mt-0.5 text-[10px] text-ink-muted">
            어떤 뱃지가 있는지 보러 가기 ›
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className="rounded-xl border border-brand-300 bg-brand-100 px-1 pb-2.5 pt-3 text-center"
            >
              <div className="mb-1 text-[22px] leading-none">{badge.emoji}</div>
              <div className="text-[9px] font-extrabold">{badge.name}</div>
              <div className="mt-0.5 text-[8px] leading-tight text-ink-muted">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
