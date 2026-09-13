"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSeenOnboarding } from "@/lib/onboarding";

/**
 * 첫 진입 분기. 온보딩을 아직 안 본 사용자만 /onboarding으로 보내고, 그 외에는 기존대로 /home.
 * localStorage를 읽어야 해서 서버 redirect가 아닌 클라이언트에서 판단한다 —
 * 판단이 끝나기 전 잠깐의 빈 화면은 Providers의 스플래시가 덮는다.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasSeenOnboarding() ? "/home" : "/onboarding");
  }, [router]);

  return null;
}
