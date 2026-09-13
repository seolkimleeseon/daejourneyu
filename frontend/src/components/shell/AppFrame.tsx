import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AppBrandPanel, AppDecorPanel } from "./AppSidePanel";

/**
 * (shell) 탭 화면과 온보딩/인증 화면이 공유하는 "웹에서도 앱 프레임처럼 보이기" 뼈대.
 * 프레임 자체 폭(480px)은 모바일과 동일하게 두고, 넓은 화면에서 남는 좌우 공간에 장식용
 * 사이드 패널을 보여준다. 프레임만 자체 스크롤하고(overflow-y-auto) 바깥/사이드 패널은
 * 뷰포트에 고정돼 있어(overflow-hidden) 스크롤해도 사이드 요소가 같이 흘러가지 않는다.
 */
export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex h-dvh w-full justify-center gap-x-10 overflow-hidden bg-brand-50">
      <AppBrandPanel />
      <div
        className={cn(
          "no-scrollbar relative flex h-dvh w-full max-w-[480px] flex-col overflow-y-auto bg-surface lg:shadow-[0_0_40px_rgba(0,0,0,0.06)]",
          className
        )}
      >
        {children}
      </div>
      <AppDecorPanel />
    </div>
  );
}
