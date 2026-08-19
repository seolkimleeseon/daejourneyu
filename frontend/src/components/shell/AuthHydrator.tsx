"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 앱 최초 마운트 시 /api/auth/me로 세션을 복구한다.
 * 토큰이 httpOnly 쿠키에 있어 JS가 읽을 수 없으므로, 로그인 여부는 서버에 물어봐야 안다.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return null;
}
