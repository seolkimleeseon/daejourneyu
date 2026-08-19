import type { ReactNode } from "react";

/** 온보딩/인증은 하단 네비가 없는 (shell) 밖 라우트다. 폭만 탭 화면과 동일하게 맞춘다. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-surface">{children}</div>;
}
