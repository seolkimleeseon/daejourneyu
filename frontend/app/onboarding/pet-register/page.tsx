"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { PetRegisterForm } from "@/components/onboarding/PetRegisterForm";

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
  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const petId = searchParams.get("petId") ?? undefined;
  /** 온보딩 흐름으로 들어온 등록인지, 마이탭에서 들어온 수정/추가인지 — 완료 후 목적지가 다르다. */
  const fromMy = searchParams.get("from") === "my";

  const handleCompleted = () => {
    if (mode === "edit" || fromMy) {
      router.back();
      return;
    }
    router.replace("/home");
  };

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
          <Button variant="text" className="mt-3" onClick={() => router.replace("/home")}>
            나중에 등록할게요
          </Button>
        ) : null}
      </div>
    </>
  );
}
