"use client";

import { TopBar } from "@/components/shell/TopBar";
import { useMyBadges } from "@/hooks/useMyBadges";
import { cn } from "@/lib/cn";

/**
 * myBadges — 얻을 수 있는 뱃지 전체 목록. 마이탭 요약은 획득분만 보여주므로,
 * "무엇을 더 할 수 있는지"는 이 화면이 담당한다.
 */
export default function MyBadgesPage() {
  const { badges, gotCount, total } = useMyBadges();

  return (
    <>
      <TopBar title="여행 뱃지" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="rounded-xl border border-line bg-card px-4 py-3.5 text-center">
          <div className="text-xs text-ink-muted">모은 뱃지</div>
          <div className="mt-0.5 text-lg font-extrabold text-brand-700">
            {gotCount}
            <span className="text-sm font-bold text-ink-muted"> / {total}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-brand transition-[width]"
              style={{ width: `${total === 0 ? 0 : (gotCount / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                badge.got ? "border-brand-300 bg-brand-100" : "border-line bg-card"
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
                  badge.got ? "bg-card" : "bg-surface"
                )}
              >
                {badge.got ? badge.emoji : "🔒"}
              </span>

              <div className="min-w-0 flex-1">
                <div className={cn("text-sm font-bold", badge.got ? "text-ink" : "text-ink-muted")}>
                  {badge.name}
                </div>
                {/* 못 얻은 뱃지에는 조건을, 얻은 뱃지에는 무엇으로 받았는지를 보여준다. */}
                <div className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {badge.got ? badge.description : badge.how}
                </div>
              </div>

              {badge.got ? (
                <span className="shrink-0 text-[10px] font-bold text-brand-700">획득</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
