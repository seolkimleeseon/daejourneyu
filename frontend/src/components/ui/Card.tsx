"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 강조 카드(선택됨/하이라이트) — 프로토타입의 border-color:#72C8B3 상태에 대응 */
  highlighted?: boolean;
}

export function Card({ highlighted, className, children, onClick, ...rest }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-line bg-card p-3",
        onClick && "cursor-pointer transition-colors active:bg-surface",
        highlighted && "border-brand-400 bg-brand-100",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
