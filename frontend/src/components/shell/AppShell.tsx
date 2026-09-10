import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AppFrame } from "./AppFrame";

/**
 * 하단 탭 네비가 보이는 라우트 그룹의 뼈대. 페이지별 TopBar는 각 page.tsx가 직접 렌더링한다.
 * 웹에서도 앱 프레임처럼 보이는 공통 뼈대(AppFrame)는 온보딩/인증 화면과 같이 쓴다.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppFrame>
      <div className="flex-1 pb-[76px]">{children}</div>
      <BottomNav />
    </AppFrame>
  );
}
