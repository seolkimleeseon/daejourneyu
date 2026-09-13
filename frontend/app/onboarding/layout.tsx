import type { ReactNode } from "react";
import { AppFrame } from "@/components/shell/AppFrame";

/** 온보딩/인증은 하단 네비가 없는 (shell) 밖 라우트다. 프레임 폭·웹 사이드 패널은 (shell)과 공유한다. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
