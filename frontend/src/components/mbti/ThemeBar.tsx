import type { CSSProperties } from "react";
import type { CourseTheme } from "@/lib/mbti";

interface ThemeBarProps {
  theme: CourseTheme;
  percent: number;
  delay?: number;
}

const THEME_META: Record<CourseTheme, { emoji: string; barClass: string; iconBgClass: string }> = {
  산책: { emoji: "🌳", barClass: "bg-brand", iconBgClass: "bg-brand-100" },
  맛집: { emoji: "🥐", barClass: "bg-accent-amber", iconBgClass: "bg-accent-amber-light" },
  문화: { emoji: "🏛️", barClass: "bg-accent-purple", iconBgClass: "bg-accent-purple-light" },
};

export function ThemeBar({ theme, percent, delay = 0 }: ThemeBarProps) {
  const meta = THEME_META[theme];
  return (
    <div
      style={{ animationDelay: `${delay}s` } as CSSProperties}
      className="mb-2 flex animate-fade-up items-center gap-2 rounded-lg border border-line bg-card p-2"
    >
      <div className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-xs ${meta.iconBgClass}`}>
        {meta.emoji}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-semibold text-ink">{theme}형</div>
        <div className="text-xs text-ink-muted">{percent}% 매칭</div>
      </div>
      <div className="ml-auto h-1.5 max-w-[50px] flex-1 overflow-hidden rounded-full bg-line">
        <div
          style={{ "--target-width": `${percent}%`, animationDelay: `${delay + 0.15}s` } as CSSProperties}
          className={`h-full animate-bar-grow rounded-full ${meta.barClass}`}
        />
      </div>
    </div>
  );
}
