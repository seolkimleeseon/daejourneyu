"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export default function KakaoCompletePage() {
  return (
    <Suspense fallback={null}>
      <KakaoCompleteInner />
    </Suspense>
  );
}

function KakaoCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const oauthError = searchParams.get("error");
    const returnTo = searchParams.get("returnTo") || "/schedule";

    if (oauthError) {
      setError(oauthError);
      return;
    }
    if (!token) {
      setError("로그인 정보를 받지 못했어요");
      return;
    }

    loginWithToken(token).then((result) => {
      if (result.ok) {
        router.replace(returnTo);
      } else {
        setError(result.error);
      }
    });
  }, [searchParams, router, loginWithToken]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-4xl">🐾</div>
      {error ? (
        <>
          <div className="text-sm font-bold text-ink">로그인에 실패했어요</div>
          <div className="text-xs text-ink-muted">{error}</div>
          <button
            type="button"
            onClick={() => router.replace("/schedule")}
            className="mt-2 text-xs font-semibold text-brand"
          >
            돌아가기
          </button>
        </>
      ) : (
        <div className="text-xs text-ink-muted">로그인 처리 중이에요...</div>
      )}
    </div>
  );
}
