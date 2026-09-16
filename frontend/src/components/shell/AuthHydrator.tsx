"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";

/**
 * 앱 최초 마운트 시 /api/auth/me로 세션을 복구하고, 로그인 상태에 맞춰 반려동물 목록을 맞춘다.
 * 토큰이 httpOnly 쿠키에 있어 JS가 읽을 수 없으므로, 로그인 여부는 서버에 물어봐야 안다.
 *
 * 포그라운드로 돌아올 때도 다시 확인한다 — 홈 화면에 설치된 PWA에서 카카오 로그인처럼 외부
 * 도메인으로 나가는 버튼을 누르면, iOS/Android가 그 이동을 시스템 브라우저(사파리·크롬)로
 * 넘겨버리는 경우가 있다. 로그인 자체는 거기서 끝나 쿠키도 정상 저장되지만, 원래 떠 있던 PWA
 * 창의 자바스크립트 상태는 그 사실을 모르니 마운트 시점의 "비로그인" 상태로 멈춰 있다 —
 * visibilitychange로 다시 보이게 될 때 재확인해야 이 경우를 놓치지 않는다.
 */
export function AuthHydrator() {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hydratePets = usePetStore((state) => state.hydrate);
  const clearPets = usePetStore((state) => state.clear);

  useEffect(() => {
    void hydrateAuth();

    const onVisible = () => {
      if (document.visibilityState === "visible") void hydrateAuth();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [hydrateAuth]);

  // 로그인/로그아웃 전환마다 반려동물 목록을 다시 맞춘다(다른 계정의 목록이 남지 않도록).
  const previousLoggedIn = useRef(false);
  useEffect(() => {
    if (isLoggedIn) {
      void hydratePets();
    } else if (previousLoggedIn.current) {
      clearPets();
    }
    previousLoggedIn.current = isLoggedIn;
  }, [isLoggedIn, hydratePets, clearPets]);

  return null;
}
