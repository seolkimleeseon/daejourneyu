"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";

/**
 * 앱 최초 마운트 시 /api/auth/me로 세션을 복구하고, 로그인 상태에 맞춰 반려동물 목록을 맞춘다.
 * 토큰이 httpOnly 쿠키에 있어 JS가 읽을 수 없으므로, 로그인 여부는 서버에 물어봐야 안다.
 */
export function AuthHydrator() {
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hydratePets = usePetStore((state) => state.hydrate);
  const clearPets = usePetStore((state) => state.clear);

  useEffect(() => {
    void hydrateAuth();
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
