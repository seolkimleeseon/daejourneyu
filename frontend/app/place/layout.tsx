import type { ReactNode } from "react";

/**
 * (shell) 밖 최상위 라우트라 AppShell의 max-w-[480px] 컨테이너를 안 거친다 — 데스크톱에서
 * 장소 상세/후기 작성이 풀블리드로 늘어나던 것을 홈탭과 동일한 폭으로 맞춘다.
 */
export default function PlaceLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface">{children}</div>;
}
