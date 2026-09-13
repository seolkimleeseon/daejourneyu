"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** 입력 오른쪽에 붙는 단위 표기 (예: kg, 살) */
  suffix?: ReactNode;
  error?: string;
}

/**
 * 온보딩/등록 폼 전용 인풋. 공용 ui primitive는 STEP2에서 확정된 세트라
 * 새 primitive를 임의로 추가하지 않고 이 도메인 안에 둔다.
 */
export function FormField({ label, suffix, error, className, ...rest }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block px-0.5 text-xs font-bold text-ink-muted">{label}</span>
      <span
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-card px-3",
          error ? "border-accent-coral" : "border-line-strong"
        )}
      >
        <input
          className={cn(
            "min-h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-steel-400",
            className
          )}
          {...rest}
        />
        {suffix ? <span className="shrink-0 text-xs text-ink-muted">{suffix}</span> : null}
      </span>
      {error ? <span className="mt-1 block px-0.5 text-[10px] text-accent-coral">{error}</span> : null}
    </label>
  );
}
