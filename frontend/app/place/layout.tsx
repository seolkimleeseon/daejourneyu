import type { ReactNode } from "react";
import { AppFrame } from "@/components/shell/AppFrame";

/**
 * (shell) 밖 최상위 라우트라 AppShell의 컨테이너를 안 거친다. 프레임 폭·웹 사이드 패널은
 * (shell)과 공유한다.
 */
export default function PlaceLayout({ children }: { children: ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
