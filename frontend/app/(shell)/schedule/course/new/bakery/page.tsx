"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/shell/TopBar";
import { LoginModal } from "@/components/my/LoginModal";
import { GeneratedResultStep } from "../mbti/steps/GeneratedResultStep";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { useCourseStore } from "@/stores/useCourseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { apiUrl } from "@/lib/api/authFetch";
import { recommendBakeryRoute } from "@/lib/bakeryCourse";
import { placeToStop } from "@/lib/courseFormat";
import { stashPendingCourseSave } from "@/lib/pendingCourseSave";
import type { Course, DaejeonDistrict, Place } from "@/types";

type Region = "전체" | DaejeonDistrict;
const REGIONS: Region[] = ["전체", "서구", "유성구", "중구", "동구", "대덕구"];

async function loadBakeries(region: Region, batch: number): Promise<Place[]> {
  const params = new URLSearchParams({ batch: String(batch) });
  if (region !== "전체") params.set("district", region);
  const response = await fetch(apiUrl(`/api/places/bakeries?${params}`));
  if (!response.ok) throw new Error("빵집 목록을 불러오지 못했어요");
  return response.json() as Promise<Place[]>;
}

export default function BakeryCoursePage() {
  const router = useRouter();
  const addCourse = useCourseStore((state) => state.addCourse);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const showToast = useToastStore((state) => state.show);
  const [region, setRegion] = useState<Region>("전체");
  const [variation, setVariation] = useState(0);
  const [batch, setBatch] = useState(0);
  const [reordered, setReordered] = useState<Place[] | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: bakeries = [], isPending: bakeriesLoading, isError, refetch } = useQuery({
    queryKey: ["bakery-candidates", region, batch],
    queryFn: () => loadBakeries(region, batch),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
  const { data: places, isPending: placesLoading, isError: placesError, refetch: refetchPlaces } = usePickablePlaces();
  const suggested = useMemo(() => recommendBakeryRoute(
    bakeries, places ?? [], variation
  ), [bakeries, places, variation]);
  const route = reordered ?? suggested;
  useEffect(() => {
    if (bakeriesLoading || placesLoading || isError || placesError || suggested.length >= 3 || batch >= 2) return;
    if (!places?.some((place) => place.petFriendly && (place.category === "산책" || place.category === "놀이터"))) return;
    setBatch((current) => current + 1);
  }, [bakeriesLoading, placesLoading, isError, placesError, suggested, batch, places]);
  const bakeryDistrict = route.find((place) => place.id.startsWith("bakery-"))?.district;
  const title = bakeryDistrict ? `${bakeryDistrict} 빵지순례 산책 코스` : "대전 빵지순례 코스";

  const changeRegion = (next: Region) => {
    setRegion(next);
    setBatch(0);
    setVariation(0);
    setReordered(null);
  };

  const buildCourse = (): Omit<Course, "id"> => ({
    label: title,
    nights: 0,
    transport: "자차",
    source: "ai",
    shared: false,
    days: [route.map(placeToStop)],
  });

  const saveCourse = () => {
    if (route.length < 3) return;
    addCourse(buildCourse());
    showToast("빵지순례 코스를 보관함에 저장했어요 🥐");
    router.push("/schedule");
  };

  const handleSave = () => {
    if (!isLoggedIn) {
      stashPendingCourseSave(buildCourse());
      setLoginOpen(true);
      return;
    }
    saveCourse();
  };

  return (
    <>
      <TopBar title="대전 빵지순례" showBack />
      <div className="px-5 pt-4">
        <div className="mb-2 text-xs font-bold text-ink-muted">추천 지역</div>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {REGIONS.map((name) => (
            <button key={name} type="button" onClick={() => changeRegion(name)}
              aria-pressed={region === name}
              className={region === name
                ? "shrink-0 rounded-full bg-brand px-3 py-2 text-xs font-bold text-white"
                : "shrink-0 rounded-full bg-line px-3 py-2 text-xs font-semibold text-ink-muted"}
            >{name}</button>
          ))}
        </div>
      </div>
      {bakeriesLoading || placesLoading ? (
        <div className="px-5 py-12 text-center text-sm text-ink-muted">가까운 빵집과 산책길을 찾고 있어요...</div>
      ) : isError ? (
        <div className="px-5 py-8 text-center text-sm text-ink-muted">
          빵집 목록을 불러오지 못했어요.
          <button type="button" onClick={() => void refetch()} className="mt-4 block w-full rounded-xl bg-brand px-4 py-3 font-bold text-white">다시 시도</button>
        </div>
      ) : placesError ? (
        <div className="px-5 py-8 text-center text-sm text-ink-muted">
          산책 장소 정보를 불러오지 못했어요.
          <button type="button" onClick={() => void refetchPlaces()} className="mt-4 block w-full rounded-xl bg-brand px-4 py-3 font-bold text-white">다시 시도</button>
        </div>
      ) : route.length < 3 ? (
        <div className="px-5 py-8 text-center text-sm text-ink-muted">
          이 지역에서는 가까운 빵집과 산책길을 묶지 못했어요. 다른 지역을 골라주세요.
        </div>
      ) : (
        <GeneratedResultStep key={`${region}-${variation}`} theme="맛집" nights={0} transport="자차"
          days={[route]} courseTitle={title} routeLabel="빵지순례 동선" bakeryMode
          onReorderDay={(_, next) => setReordered(next)}
          onRegenerate={() => { setVariation((current) => current + 1); setReordered(null); }}
          onSave={handleSave} onGoHome={() => router.push("/schedule")} />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLoggedIn={saveCourse} />
    </>
  );
}
