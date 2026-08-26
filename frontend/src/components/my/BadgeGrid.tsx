import type { Badge } from "@/lib/badges";

/**
 * 마이탭의 뱃지 섹션. 위쪽 그리드는 "내가 모은 것", 아래 목록은 "아직 받을 수 있는 것"이다.
 *
 * 뱃지는 서로 독립된 퀘스트라 정해진 순서가 없다 — 아래 목록을 "다음 목표"처럼 부르거나
 * 번호를 매기면 단계별 진행으로 잘못 읽히므로, 조건만 나열하고 순서를 암시하지 않는다.
 *
 * 못 받은 뱃지를 감추면 무엇을 더 할 수 있는지 안 보이고, 반대로 자물쇠로만 채우면 무슨
 * 뱃지인지조차 안 보여 카탈로그처럼 읽힌다. 그래서 흐린 이모지와 획득 조건을 같이 보여준다.
 */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const got = badges.filter((badge) => badge.got);
  const locked = badges.filter((badge) => !badge.got);

  return (
    <div>
      <div className="mb-2 mt-1 flex items-center justify-between px-1 text-xs font-bold text-ink-muted">
        <span>내 여행 뱃지</span>
        <span>
          {got.length}/{badges.length}
        </span>
      </div>

      {got.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-[11px] text-ink-muted">
          아직 모은 뱃지가 없어요. 아래에서 마음에 드는 것부터 해보세요.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {got.map((badge) => (
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

      {locked.length > 0 ? (
        <div className="mt-4">
          <div className="mb-1.5 px-1 text-xs font-bold text-ink-muted">받을 수 있는 뱃지</div>
          <div className="flex flex-col gap-1.5">
            {locked.map((badge) => (
              <div
                key={badge.name}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2.5"
              >
                {/* 자물쇠로 덮지 않는다 — 어떤 뱃지인지 보여야 해볼 만한 것으로 읽힌다. */}
                <span className="shrink-0 text-lg leading-none opacity-40 grayscale">
                  {badge.emoji}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-ink-muted">{badge.name}</div>
                  <div className="mt-0.5 text-[10px] leading-tight text-ink-muted">{badge.how}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-center text-[11px] font-bold text-brand-700">
          🎉 뱃지를 모두 모았어요!
        </p>
      )}
    </div>
  );
}
