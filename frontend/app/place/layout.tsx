import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";

/**
 * (shell) 밖 최상위 라우트지만 하단 탭 네비는 (shell)과 똑같이 보여준다 — 장소 상세는
 * 맵/홈/피드/챗봇 등 여러 탭에서 진입하는 공용 화면이라, 네비가 없으면 뒤로가기를 여러 번
 * 눌러야 빠져나갈 수 있다(article/feed 상세 라우트와 같은 이유).
 * 라우트 위치는 CLAUDE.md 규칙대로 (shell) 밖에 두고, 레이아웃만 AppShell을 재사용한다.
 */
export default function PlaceLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
