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
import { useCourseStore } from "@/stores/useCourseStore";
import { useSyncCoursesFromApi } from "@/hooks/useSyncCoursesFromApi";
import { findActiveTrip } from "@/lib/schedule";
import { toTickerPlace, type TickerPlace } from "@/lib/placeTicker";
import { mockArticles } from "@/mocks";

/** Fisher-Yates — 예정된 여행이 없을 때 보여줄 반려동반 여행지를 매번 다른 순서로 섞는다. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function HomePage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const activePet = usePetStore((state) => state.activePet());
  useSyncCoursesFromApi();
  const courses = useCourseStore((state) => state.courses);
  const schedules = useCourseStore((state) => state.schedules);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const activeTrip = useMemo(
    () => (isLoggedIn ? findActiveTrip(schedules, courses, new Date().toISOString().slice(0, 10)) : null),
    [isLoggedIn, schedules, courses]
  );

  // 7일 이내 예정되었거나 진행 중인 여행이 있으면 그 코스의 장소로, 없으면 문체부 반려동물
  // 동반가능 시설 현황(source=petacp) 중에서 랜덤하게 골라 장소별 날씨 티커를 채운다.
  const { data: travelPlaces = [], isPending: travelPlacesLoading } = usePlaces({ source: "petacp" });

  const latestArticle = useMemo(
    () => [...mockArticles].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null,
    []
  );

  const tickerPlaces = useMemo<TickerPlace[]>(() => {
    if (activeTrip) {
      // CourseStop에는 좌표가 없어 날씨 배지는 비워두고 이름/카테고리만 보여준다.
      return activeTrip.stops.map((stop) => ({ id: stop.placeId, name: stop.name, category: stop.category }));
    }
    return shuffle(travelPlaces.filter((place) => place.petFriendly))
      .slice(0, 6)
      .map(toTickerPlace);
  }, [activeTrip, travelPlaces]);

  const tickerLoading = !activeTrip && travelPlacesLoading;

  return (
    <>
      <TopBar title="대저니유" />
      <div className="px-4 pb-6 pt-3">
        {!isLoggedIn && !guestBannerDismissed ? (
          <div className="mb-2.5 flex w-full items-center justify-between rounded-lg bg-accent-amber-light px-3 py-2">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="flex-1 text-left text-[10px] font-medium text-accent-amber"
            >
              🔒 로그인하면 코스 저장 · 후기 작성이 가능해요
            </button>
            <button
              type="button"
              onClick={() => setGuestBannerDismissed(true)}
              className="pl-2 text-[11px] text-accent-amber"
            >
              ✕
            </button>
          </div>
        ) : null}

        <HomeStatusCard
          pet={activePet}
          isLoggedIn={isLoggedIn}
          upcomingTrip={activeTrip}
          tickerPlaces={tickerPlaces}
          tickerLoading={tickerLoading}
        />

        {latestArticle ? (
          <>
            <div className="mb-2 px-1 text-xs font-bold text-ink-muted">대전 소식</div>
            <button
              type="button"
              onClick={() => router.push(`/article/${latestArticle.id}`)}
              className="mb-5 flex w-full items-center gap-2.5 rounded-2xl border border-line bg-card px-3.5 py-3 text-left shadow-sm active:scale-[.99]"
            >
              <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-icon-article text-sm text-white">
                📰
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-ink">{latestArticle.title}</span>
                <span className="block text-[11px] text-ink-muted">최신 아티클</span>
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-accent-coral-light px-2.5 py-1 text-[11px] font-bold text-accent-coral">
                보러가기 →
              </span>
            </button>
          </>
        ) : null}

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">무엇부터 시작할까요</div>
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <TileButton
            variant="outlined"
            emoji="🐾"
            title="내 반려동물 MBTI"
            subtitle={activePet?.mbti ? `${activePet.mbti.code} · ${activePet.mbti.name}` : "여행 성향 알아보기"}
            tone="purple"
            onClick={() =>
              router.push(activePet?.mbti ? "/schedule/course/new/mbti?quick=1" : "/schedule/course/new/mbti")
            }
          />
          <TileButton
            variant="outlined"
            emoji="💬"
            title="오늘 어디 갈까?"
            subtitle="장소와 코스 추천받기"
            tone="navy"
            onClick={() => router.push("/home/chatbot")}
          />
        </div>

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">축제 캘린더</div>
        <div className="flex flex-col gap-2.5">
          <HomeFeatureCard
            emoji=""
            eyebrow="DAEJEON FESTIVAL"
            titleLines={["축제", "캘린더"]}
            subtitle="반려동물과 함께 갈 수 있는 축제를 확인해보세요"
            ctaLabel="축제 일정 보기"
            gradientClass="bg-brand-100"
            backgroundImageSrc="/icons/3d/bg_festival_card.png"
            onClick={() => router.push("/home/festival")}
          />
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
