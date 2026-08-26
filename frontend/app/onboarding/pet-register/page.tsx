"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { PetRegisterForm } from "@/components/onboarding/PetRegisterForm";
import { markOnboardingSeen } from "@/lib/onboarding";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * petRegister — 온보딩과 마이탭 '정보 수정'이 함께 쓰는 진입점.
 * 화면은 껍데기만 두고 생성/수정 분기는 PetRegisterForm이 전부 처리한다(PLAN.md §4-2).
 */
export default function PetRegisterPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>}>
      <PetRegisterPageInner />
    </Suspense>
  );
}

function PetRegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  /** 세션 복구 전에는 로그인 여부를 알 수 없다 — 이때 게이팅을 띄우면 정상 사용자도 막힌다. */
  const authHydrated = useAuthStore((state) => state.hydrated);
  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const petId = searchParams.get("petId") ?? undefined;
  /** 온보딩 흐름으로 들어온 등록인지, 마이탭에서 들어온 수정/추가인지 — 완료 후 목적지가 다르다. */
  const fromMy = searchParams.get("from") === "my";

  const handleCompleted = () => {
    if (mode === "edit" || fromMy) {
      router.back();
      return;
    }
    // 온보딩 흐름의 마지막 화면이므로 여기서 완료를 기록한다.
    markOnboardingSeen();
    router.replace("/home");
  };

  const handleSkip = () => {
    markOnboardingSeen();
    router.replace("/home");
  };

  // 반려동물은 계정에 매달리므로 로그인 없이는 저장할 수 없다. 폼을 다 채운 뒤 서버가
  // "인증이 필요합니다"로 막는 대신, 들어온 시점에 로그인부터 안내한다.
  if (authHydrated && !isLoggedIn) {
    const query = searchParams.toString();
    const backHere = `/onboarding/pet-register${query ? `?${query}` : ""}`;
    return (
      <>
        <TopBar title="반려동물 등록" showBack />
        <div className="px-5 pb-8 pt-4 text-center">
          <div className="mt-10 text-4xl">🐾</div>
          <p className="mt-3 text-sm font-bold text-ink">로그인이 필요해요</p>
          <p className="mt-1 text-xs text-ink-muted">
            반려동물 정보는 계정에 저장돼요. 로그인하면 이어서 등록할 수 있어요.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => router.push(`/onboarding/login?next=${encodeURIComponent(backHere)}`)}
            >
              로그인
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/onboarding/signup?next=${encodeURIComponent(backHere)}`)}
            >
              회원가입
            </Button>
            <Button variant="text" onClick={handleSkip}>
              나중에 등록할게요
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={mode === "edit" ? "반려동물 정보 수정" : "반려동물 등록"} showBack />
      <div className="px-5 pb-8 pt-4">
        {mode === "create" ? (
          <p className="mb-4 text-xs text-ink-muted">
            동반 조건은 크기와 견종에 따라 달라져요. 등록해두면 맞는 장소만 골라서 보여드릴게요.
          </p>
        ) : null}

        <PetRegisterForm mode={mode} petId={petId} onCompleted={handleCompleted} />

        {mode === "create" && !fromMy ? (
          <Button variant="text" className="mt-3" onClick={handleSkip}>
            나중에 등록할게요
          </Button>
        ) : null}
      </div>
    </>
  );
}
