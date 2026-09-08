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
    <div className="flex gap-1.5 px-5 pb-3 pt-3">
      {labels.map((label, index) => {
        const isActive = index === active;
        const isDone = index < active;
        return (
          <div
            key={label}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-center text-xs font-semibold transition-colors",
              isActive && "border-[1.5px] border-brand bg-card text-brand-700",
              isDone && "border-brand-300 bg-brand-100 text-brand-700",
              !isActive && !isDone && "border-line bg-card text-ink-muted"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                isActive && "bg-brand text-white",
                isDone && "bg-brand text-white",
                !isActive && !isDone && "bg-line-strong text-ink-muted"
              )}
            >
              {isDone ? "✓" : index + 1}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
}
