import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/**
 * (shell) 밖 최상위 라우트지만 하단 탭 네비는 (shell)과 똑같이 보여준다 — 공유 코스 상세는
 * 둘러보기 '코스'/'내 글' 양쪽에서 들어오고, 읽고 나서 다른 탭으로 넘어가는 흐름이 많아
 * 네비가 없으면 뒤로가기를 여러 번 눌러야 빠져나갈 수 있다(아티클 라우트와 같은 이유).
 * 라우트 위치는 CLAUDE.md 규칙대로 (shell) 밖에 두고, 레이아웃만 AppShell을 재사용한다.
 */
export default function FeedDetailLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
