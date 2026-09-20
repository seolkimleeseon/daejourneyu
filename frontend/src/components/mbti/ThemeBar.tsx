import { Emoji3D } from "@/components/ui/Emoji3D";
import type { CourseTheme } from "@/lib/mbti";

interface ThemeBarProps {
  theme: CourseTheme;
  percent: number;
}

const THEME_META: Record<
  CourseTheme,
  { emoji: string; barClass: string; iconBgClass: string; textClass: string }
> = {
  산책: { emoji: "🌳", barClass: "bg-brand", iconBgClass: "bg-brand-100", textClass: "text-brand-700" },
  맛집: {
    emoji: "🥐",
    barClass: "bg-accent-amber",
    iconBgClass: "bg-accent-amber-light",
    textClass: "text-accent-amber",
  },
  문화: {
    emoji: "🏛️",
    barClass: "bg-accent-purple",
    iconBgClass: "bg-accent-purple-light",
    textClass: "text-accent-purple",
  },
};

/**
 * MBTI 결과에서 뽑은 "이 아이한테 이 테마가 얼마나 맞는지" 한 줄. 세 줄(산책·맛집·문화)이
 * 합쳐 100%가 되고, 이 비율이 그대로 AI 코스 추천에서 장소를 고르는 가중치로 쓰인다.
 */
export function ThemeBar({ theme, percent }: ThemeBarProps) {
  const meta = THEME_META[theme];
  return (
    <div className="mb-2 flex items-center gap-2.5 rounded-lg border border-line bg-card p-2.5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.iconBgClass}`}>
        <Emoji3D emoji={meta.emoji} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold text-ink">{theme}형</span>
          <span className={`text-[11px] font-semibold tabular-nums ${meta.textClass}`}>{percent}% 매칭</span>
        </div>
        {/* 막대 폭이 50px로 묶여 있어서 40%와 30%가 사실상 같은 길이로 보였다 — 줄 전체 폭을 쓴다.
            세 줄이 같은 길이의 트랙을 공유해야 비율 비교가 눈으로 된다. */}
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${meta.barClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
