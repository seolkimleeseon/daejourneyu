"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { PetPassportCard } from "@/components/my/PetPassportCard";
import { PetSwitcher } from "@/components/my/PetSwitcher";
import { BadgeGrid } from "@/components/my/BadgeGrid";
import { MenuItem } from "@/components/my/MenuItem";
import { LoginModal } from "@/components/my/LoginModal";
import { LogoutModal } from "@/components/my/LogoutModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { useReviews } from "@/hooks/useReviews";
import { computeMyBadges } from "@/lib/badges";
import { mockCourses, mockCourseSchedules } from "@/mocks";

export default function MyPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const pets = usePetStore((state) => state.pets);
  const activePetIndex = usePetStore((state) => state.activePetIndex);
  const switchActivePet = usePetStore((state) => state.switchActivePet);
  const activePet = usePetStore((state) => state.activePet());
  const showToast = useToastStore((state) => state.show);
  const { data: reviews = [] } = useReviews();

  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const badges = computeMyBadges({
    isLoggedIn,
    pets,
    activePet,
    courses: mockCourses,
    schedules: mockCourseSchedules,
    reviews,
  });

  const handlePassportClick = () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    // 반려동물이 있으면 수정, 없으면 등록으로 — 두 경우 모두 PetRegisterForm 하나를 재사용한다.
    router.push(
      activePet
        ? `/onboarding/pet-register?mode=edit&petId=${activePet.id}&from=my`
        : "/onboarding/pet-register?from=my"
    );
  };

  const handleReviewsClick = () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    router.push("/my/reviews");
  };

  const myReviewCount = reviews.filter((review) => review.isMine).length;

  return (
    <>
      <TopBar title="마이" />
      <div className="px-4 pb-6 pt-3">
        <PetPassportCard pet={activePet} isLoggedIn={isLoggedIn} onClick={handlePassportClick} />

        {isLoggedIn && pets.length > 0 ? (
          <PetSwitcher
            pets={pets}
            activeIndex={activePetIndex}
            onSwitch={switchActivePet}
            onAddPet={() => router.push("/onboarding/pet-register?from=my")}
          />
        ) : null}

        {isLoggedIn ? (
          <div className="mt-2">
            <BadgeGrid badges={badges} />
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-1 px-1 text-xs font-bold text-ink-muted">내 활동</div>
          <MenuItem
            label="내가 쓴 후기"
            trailing={isLoggedIn ? `${myReviewCount}개 ›` : "›"}
            onClick={handleReviewsClick}
          />
          <MenuItem
            label="알림 설정 · 준비 중"
            trailing="›"
            onClick={() => showToast("알림 설정은 준비 중이에요")}
          />
          {isLoggedIn ? (
            <MenuItem label="로그아웃" tone="danger" onClick={() => setLogoutOpen(true)} />
          ) : (
            <MenuItem
              label="로그인 / 회원가입"
              tone="brand"
              trailing="›"
              onClick={() => setLoginOpen(true)}
            />
          )}
        </div>

        <div className="mt-5 pb-1 text-center text-[9px] text-ink-muted">대저니유 v1.0.0</div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
