import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

/** 하단 탭 네비가 보이는 라우트 그룹의 뼈대. 페이지별 TopBar는 각 page.tsx가 직접 렌더링한다. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <div className="flex-1 pb-[76px]">{children}</div>
      <BottomNav />
    </div>
  );
}
