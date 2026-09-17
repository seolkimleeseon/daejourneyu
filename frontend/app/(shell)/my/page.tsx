"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { PetPassportCard } from "@/components/my/PetPassportCard";
import { PetSwitcher } from "@/components/my/PetSwitcher";
import { BadgeGrid } from "@/components/my/BadgeGrid";
import { BadgeNearline } from "@/components/my/BadgeNearline";
import { BadgeDetailModal } from "@/components/my/BadgeDetailModal";
import { MenuItem } from "@/components/my/MenuItem";
import { LoginModal } from "@/components/my/LoginModal";
import { LogoutModal } from "@/components/my/LogoutModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { useReviews } from "@/hooks/useReviews";
import { useMyBadges } from "@/hooks/useMyBadges";
import type { Badge } from "@/lib/badges";
import { ro } from "@/lib/josa";

export default function MyPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  /** 세션 복구 전에는 로그인 여부를 알 수 없다 — 이때 탭하면 로그인 화면으로 잘못 보내게 된다. */
  const hydrated = useAuthStore((state) => state.hydrated);
  const pets = usePetStore((state) => state.pets);
  const activePetIndex = usePetStore((state) => state.activePetIndex);
  const switchActivePet = usePetStore((state) => state.switchActivePet);
  const activePet = usePetStore((state) => state.activePet());
  const showToast = useToastStore((state) => state.show);
  const { data: reviews = [] } = useReviews();

  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  /** 뱃지 상세 모달의 대상. null이면 닫힌 상태다. */
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const { badges, nearest, nearestMessage } = useMyBadges();

  /**
   * 대표(활성) 반려동물 전환. 여권 카드와 뱃지 주어가 통째로 바뀌는 조작인데 화면이 조용히
   * 갈아끼워지기만 하면 눌린 게 맞는지 알기 어려워서, 무엇으로 바뀌었는지 토스트로 말해준다.
   */
  const handleSwitchPet = (index: number) => {
    switchActivePet(index);
    const pet = pets[index];
    if (pet) showToast(`대표 반려동물을 ${pet.emoji} ${pet.name}${ro(pet.name)} 바꿨어요`);
  };

  const handlePassportClick = () => {
    if (!hydrated) return;
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
    if (!hydrated) return;
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
        <PetPassportCard
          pet={activePet}
          isLoggedIn={isLoggedIn}
          loading={!hydrated}
          onClick={handlePassportClick}
        />

        {isLoggedIn && pets.length > 0 ? (
          <PetSwitcher
            pets={pets}
            activeIndex={activePetIndex}
            onSwitch={handleSwitchPet}
            onAddPet={() => router.push("/onboarding/pet-register?from=my")}
          />
        ) : null}

        {isLoggedIn ? (
          <div className="mt-2">
            <BadgeGrid
              badges={badges}
              petName={activePet?.name}
              nearline={
                <BadgeNearline
                  badge={nearest}
                  message={nearestMessage}
                  onGo={(href) => router.push(href)}
                />
              }
              onSelectBadge={setSelectedBadge}
              onOpenAll={() => router.push("/my/badges")}
            />
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-1 px-1 text-xs font-bold text-ink-muted">내 활동</div>
          <MenuItem
            label="내가 쓴 후기"
            icon="✍️"
            trailing={isLoggedIn ? `${myReviewCount}개 ›` : "›"}
            onClick={handleReviewsClick}
          />
          <MenuItem
            label="알림 설정 · 준비 중"
            icon="🔔"
            trailing="›"
            onClick={() => showToast("알림 설정은 준비 중이에요")}
          />
          {!hydrated ? null : isLoggedIn ? (
            <MenuItem
              label="로그아웃"
              icon="👋"
              tone="danger"
              onClick={() => setLogoutOpen(true)}
            />
          ) : (
            <MenuItem
              label="로그인 / 회원가입"
              icon="🐾"
              tone="brand"
              trailing="›"
              onClick={() => setLoginOpen(true)}
            />
          )}
        </div>

        <div className="mt-5 pb-1 text-center text-[9px] text-ink-muted">대저니유 v1.0.0</div>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        onClose={() => setSelectedBadge(null)}
        onGo={(href) => {
          setSelectedBadge(null);
          router.push(href);
        }}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
