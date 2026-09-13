"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { useMyBadges } from "@/hooks/useMyBadges";
import { groupBadgesByCategory, RARITY_LABEL, type Badge } from "@/lib/badges";
import { cn } from "@/lib/cn";

/**
 * 여행 뱃지 전체 목록. 마이탭 요약(BadgeGrid)이 "내가 어디까지 왔나"를 답한다면,
 * 이 화면은 **"뭘 하면 받나"**를 답한다 — 그래서 모든 줄에 획득 조건이 붙는다.
 *
 * 계열로 섹션을 나눈 건 이 화면뿐이다. 마이탭 그리드에서는 계열당 몇 개라 잘게 쪼개지지만,
 * 여기서는 44줄을 그냥 나열하는 것보다 훨씬 읽기 좋다.
 *
 * 뱃지는 서로 독립된 퀘스트라 정해진 순서가 없다 — 번호를 매기거나 "다음 목표"처럼 부르면
 * 단계별 진행으로 잘못 읽히므로, 계열 안에서는 정렬하지 않고 조건만 나열한다.
 */
export default function MyBadgesPage() {
  const router = useRouter();
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
                <BadgeRow
                  key={badge.id}
                  badge={badge}
                  onGo={(href) => router.push(href)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

interface BadgeRowProps {
  badge: Badge;
  onGo: (href: string) => void;
}

/**
 * 뱃지 한 줄. 조건만 적어두면 거기서 끊기므로, 갈 곳이 있는 뱃지는 줄 자체가 그 화면으로 가는
 * 버튼이 된다("다음 한 걸음"). 이미 딴 뱃지는 더 할 일이 없어 누를 수 없다.
 */
function BadgeRow({ badge, onGo }: BadgeRowProps) {
  // 히든은 미획득 상태에서 이름·조건·진행도를 전부 가린다. 진행 바를 남기면 조건이 새어나간다.
  const masked = badge.hidden && !badge.got;
  const maxed = badge.level >= badge.maxLevel;
  const href = maxed ? undefined : badge.href;
  const showProgress = !masked && !maxed && badge.current > 0;

  // 단계형은 한 단계 땄다고 끝이 아니다. 이미 딴 뱃지라도 다음 단계가 남아 있으면 거리를 말해준다.
  const levelHint =
    badge.got && badge.maxLevel > 1 && !maxed
      ? `Lv.${badge.level + 1}까지 ${badge.target - badge.current}개 더`
      : null;
  const subtitle = badge.got ? (levelHint ?? badge.description) : badge.how;

  const body = (
    <>
      {/* 자물쇠로 갈아치우지 않는다 — 어떤 뱃지인지 보여야 해볼 만한 것으로 읽힌다. */}
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
          badge.got ? "bg-card" : "bg-surface opacity-40 grayscale"
        )}
      >
        {masked ? "❔" : badge.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className={cn("text-sm font-bold", badge.got ? "text-ink" : "text-ink-muted")}>
          {masked ? "???" : badge.name}
        </div>
        {/* 받은 뱃지에는 무엇으로 받았는지를, 아직인 뱃지에는 조건을 보여준다. */}
        <div className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">{subtitle}</div>
        {/* 조건만 적어두면 거기서 끊기므로 갈 곳을 한 줄 더 붙인다. 조건 문장에 이어 붙이면
            줄바꿈이 지저분해져서 따로 뗀다. */}
        {href ? (
          <div className="mt-1 text-[11px] font-bold text-brand-700">보러 가기 ›</div>
        ) : null}
        {showProgress ? (
          <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, (badge.current / badge.target) * 100)}%` }}
            />
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-right">
        <div className="text-[10px] font-bold text-brand-700">
          {masked ? "" : maxed ? "획득" : `${badge.current}/${badge.target}`}
        </div>
        <div className="mt-0.5 text-[9px] font-semibold text-ink-muted">
          {RARITY_LABEL[badge.rarity]}
        </div>
      </div>
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left",
    badge.got ? "border-brand-300 bg-brand-100" : "border-line bg-card"
  );

  if (!href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" onClick={() => onGo(href)} className={cn(className, "active:opacity-60")}>
      {body}
    </button>
  );
}
