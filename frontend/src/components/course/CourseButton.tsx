"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * 내 여정(코스) 화면 전용 primary 버튼. 공용 `Button`의 primary 조합(`bg-brand` + 흰 글씨)이
 * 명암비가 낮아(약 2.8:1, 권장 4.5:1 미달) 글자 수가 많은 버튼에서 가독성이 떨어진다.
 * 진한 배경(brand-700 채우기, 잉크색 글씨) 둘 다 칙칙해 보인다는 피드백이 있어, 밝고 맑은
 * 연한 민트 배경(brand-100) + 진한 민트 글씨(brand-700) 조합으로 바꿨다 — 명암비는 충분히
 * 확보되면서(연한 배경 위 진한 글씨) 무겁지 않고 화사하게 보인다.
 * 앱 전체(Button 자체) 색을 바꾸는 건 다른 Player들 확인 후 결정할 사안이라, 그 전까지는
 * 이 탭 안에서만 국한해서 쓴다.
 */
export function CourseButton({ className, variant, ...rest }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn(
        (!variant || variant === "primary") &&
          "border border-brand-300 bg-brand-100 text-brand-700 active:bg-brand-300",
        className
      )}
      {...rest}
    />
  );
}
