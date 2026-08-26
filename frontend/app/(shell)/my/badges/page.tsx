"use client";

import { TopBar } from "@/components/shell/TopBar";
import { useMyBadges } from "@/hooks/useMyBadges";
import { groupBadgesByCategory } from "@/lib/badges";
import { cn } from "@/lib/cn";

/**
 * 여행 뱃지 전체 목록. 마이탭 요약(BadgeGrid)이 "내가 어디까지 왔나"를 답한다면,
 * 이 화면은 **"뭘 하면 받나"**를 답한다 — 그래서 모든 줄에 획득 조건이 붙는다.
 *
 * 계열로 섹션을 나눈 건 이 화면뿐이다. 마이탭 그리드에서는 계열당 1~3개라 잘게 쪼개지지만,
 * 여기서는 8줄을 그냥 나열하는 것보다 읽기 좋고 뱃지가 늘어날수록 이점이 커진다.
 *
 * 뱃지는 서로 독립된 퀘스트라 정해진 순서가 없다 — 번호를 매기거나 "다음 목표"처럼 부르면
 * 단계별 진행으로 잘못 읽히므로, 계열 안에서는 정렬하지 않고 조건만 나열한다.
 */
export default function MyBadgesPage() {
  const { badges, gotCount, total } = useMyBadges();
  const groups = groupBadgesByCategory(badges);

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

        {groups.map((group) => (
          <section key={group.category} className="mt-5">
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <span className="text-xs font-bold text-ink">{group.category}</span>
              <span className="text-[10px] text-ink-muted">
                {group.gotCount}/{group.badges.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {group.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                    badge.got ? "border-brand-300 bg-brand-100" : "border-line bg-card"
                  )}
                >
                  {/* 자물쇠로 갈아치우지 않는다 — 어떤 뱃지인지 보여야 해볼 만한 것으로 읽힌다. */}
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
                      badge.got ? "bg-card" : "bg-surface opacity-40 grayscale"
                    )}
                  >
                    {badge.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={cn("text-sm font-bold", badge.got ? "text-ink" : "text-ink-muted")}
                    >
                      {badge.name}
                    </div>
                    {/* 받은 뱃지에는 무엇으로 받았는지를, 아직인 뱃지에는 조건을 보여준다. */}
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
          </section>
        ))}
      </div>
    </>
  );
}
