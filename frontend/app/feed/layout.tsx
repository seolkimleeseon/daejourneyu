import type { ReactNode } from "react";

/** (shell) 밖 최상위 라우트라 AppShell 컨테이너를 안 거친다 — 탭 화면과 동일한 폭으로 맞춘다. */
export default function FeedDetailLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface">{children}</div>;
}
