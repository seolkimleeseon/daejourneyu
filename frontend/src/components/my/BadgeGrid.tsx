import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/cn";

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const gotCount = badges.filter((badge) => badge.got).length;

  return (
    <div>
      <div className="mb-2 mt-1 flex items-center justify-between px-1 text-xs font-bold text-ink-muted">
        <span>내 여행 뱃지</span>
        <span>
          {gotCount}/{badges.length}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {badges.map((badge) => (
          <div
            key={badge.name}
            className={cn(
              "rounded-xl border border-line px-1 pb-2.5 pt-3 text-center",
              badge.got ? "border-brand-300 bg-brand-100" : "opacity-50"
            )}
          >
            <div className={cn("mb-1 text-[22px] leading-none", !badge.got && "grayscale")}>
              {badge.got ? badge.emoji : "🔒"}
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
    </div>
  );
}
