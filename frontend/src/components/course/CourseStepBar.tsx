import { cn } from "@/lib/cn";

const DEFAULT_LABELS = ["기간", "조건", "이동", "코스"] as const;

interface CourseStepBarProps {
  /** 0-indexed 현재 활성 스텝 */
  active: number;
  /** 위저드마다 스텝 구성이 다르므로(MBTI 4단계 vs 직접 짓기 3단계) 필요 시 오버라이드 */
  labels?: readonly string[];
}

/** MBTI·직접 짓기 코스 생성 위저드 공용 상단 스텝 표시. */
export function CourseStepBar({ active, labels = DEFAULT_LABELS }: CourseStepBarProps) {
  return (
    <div className="flex gap-1.5 px-4 pb-3.5">
      {labels.map((label, index) => (
        <div
          key={label}
          className={cn(
            "flex-1 rounded-lg bg-surface py-2 text-center text-xs font-semibold text-ink-muted",
            index === active && "bg-brand text-white",
            index < active && "bg-brand-100 text-brand-700"
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
