"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { HomeStatusCard } from "@/components/home/HomeStatusCard";
import { HomeFeatureCard } from "@/components/home/HomeFeatureCard";
import { TileButton } from "@/components/ui/TileButton";
import { LoginModal } from "@/components/my/LoginModal";
import { usePlaces } from "@/hooks/usePlaces";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { findUpcomingTrip } from "@/lib/schedule";
import { mockArticles, mockCourseSchedules, mockCourses } from "@/mocks";

export default function HomePage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const activePet = usePetStore((state) => state.activePet());
  const showToast = useToastStore((state) => state.show);
  const { data: places = [] } = usePlaces();
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const upcomingTrip = useMemo(
    () =>
      isLoggedIn
        ? findUpcomingTrip(mockCourseSchedules, mockCourses, new Date().toISOString().slice(0, 10))
        : null,
    [isLoggedIn]
  );

  const latestArticle = useMemo(
    () => [...mockArticles].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    []
  );

  const crowdPlaces = useMemo(() => places.filter((place) => place.petFriendly).slice(0, 6), [places]);

  return (
    <>
      <TopBar title="대저니유" />
      <div className="px-4 pb-6 pt-3">
        {!isLoggedIn && !guestBannerDismissed ? (
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="mb-2.5 flex w-full items-center justify-between rounded-lg bg-accent-amber-light px-3 py-2"
          >
            <span className="text-[10px] font-medium text-accent-amber">
              🔒 로그인하면 코스 저장 · 후기 작성이 가능해요
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setGuestBannerDismissed(true);
              }}
              className="pl-2 text-[11px] text-accent-amber"
            >
              ✕
            </span>
          </button>
        ) : null}

        <HomeStatusCard
          pet={activePet}
          isLoggedIn={isLoggedIn}
          upcomingTrip={upcomingTrip}
          crowdPlaces={crowdPlaces}
        />

        {latestArticle ? (
          <button
            type="button"
            onClick={() => router.push(`/article/${latestArticle.id}`)}
            className="mb-4 flex w-full items-center gap-2 rounded-lg bg-accent-coral-light px-3 py-2.5 text-left"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-card text-sm">
              📰
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-accent-coral">
                {latestArticle.title}
              </span>
              <span className="block text-[11px] text-accent-coral/80">최신 아티클 · 보기</span>
            </span>
          </button>
        ) : null}

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">무엇부터 시작할까요</div>
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <TileButton
            variant="outlined"
            emoji="🐾"
            title="내 반려동물 MBTI"
            subtitle={activePet?.mbti ? `${activePet.mbti.code} · 결과 보기` : "여행 성향 알아보기"}
            tone="purple"
            onClick={() => showToast("여행 MBTI는 다음 스텝에서 제공돼요")}
          />
          <TileButton
            variant="outlined"
            emoji="💬"
            title="오늘 어디 갈까?"
            subtitle="장소와 코스 추천받기"
            tone="brand"
            onClick={() => showToast("AI 챗봇은 다음 스텝에서 제공돼요")}
          />
        </div>

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">이번 달 대전 소식</div>
        <div className="flex flex-col gap-2.5">
          <HomeFeatureCard
            emoji="📰"
            eyebrow="MONTHLY BRIEFING"
            titleLines={["이번 달", "대전 소식"]}
            subtitle="신규 · 핫플 · 인기 장소를 모아봤어요"
            ctaLabel="월간 브리핑 보기"
            gradientClass="bg-gradient-to-br from-accent-amber to-accent-coral"
            onClick={() => router.push("/home/weekly-briefing")}
          />
          <HomeFeatureCard
            emoji="🎆"
            eyebrow="DAEJEON FESTIVAL"
            titleLines={["이번 달", "대전 축제"]}
            subtitle="반려동물과 함께 갈 수 있는 축제를 확인해보세요"
            ctaLabel="축제 일정 보기"
            gradientClass="bg-gradient-to-br from-accent-purple to-accent-navy"
            onClick={() => router.push("/home/festival")}
          />
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
