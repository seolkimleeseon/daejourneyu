"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Tag } from "@/components/ui/Tag";
import { PlaceCard } from "@/components/place/PlaceCard";
import { DistrictMap } from "@/components/map/DistrictMap";
import { TravelingDog } from "@/components/map/TravelingDog";
import { usePlaces } from "@/hooks/usePlaces";
import { CATEGORIES, DISTRICTS } from "@/lib/placeFilters";
import type { DaejeonDistrict, PlaceCategory } from "@/types";

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 화면 단계는 URL 쿼리(`?district=&category=`)를 정본으로 삼는다. 이렇게 해야 장소 상세로
  // 들어갔다가 뒤로가기로 돌아왔을 때 구 선택 화면이 아니라 방금 보던 목록으로 복귀한다.
  const districtParam = searchParams.get("district");
  const district: DaejeonDistrict | null =
    districtParam && (DISTRICTS as string[]).includes(districtParam)
      ? (districtParam as DaejeonDistrict)
      : null;
  const categoryParam = searchParams.get("category");
  const category: PlaceCategory | null =
    categoryParam && (CATEGORIES as string[]).includes(categoryParam)
      ? (categoryParam as PlaceCategory)
      : null;

  // 강아지 이동 연출은 "이번에 구를 새로 골랐을 때"만 보여준다. 뒤로가기로 목록에 복귀할 땐 건너뛴다.
  const [traveling, setTraveling] = useState(false);
  const { data: list = [], isLoading } = usePlaces({ district, category });

  useEffect(() => {
    if (!traveling) return;
    const timer = setTimeout(() => setTraveling(false), 1500);
    return () => clearTimeout(timer);
  }, [traveling]);

  const step: "districts" | "traveling" | "list" = !district
    ? "districts"
    : traveling
      ? "traveling"
      : "list";

  const handleSelectDistrict = (next: DaejeonDistrict) => {
    setTraveling(true);
    router.push(`/map?district=${encodeURIComponent(next)}`);
  };

  const handleSelectCategory = (next: PlaceCategory | null) => {
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (next) params.set("category", next);
    const query = params.toString();
    // 카테고리 전환은 히스토리를 쌓지 않는다 — 뒤로가기 한 번에 구 선택으로 나가도록.
    router.replace(query ? `/map?${query}` : "/map");
  };

  return (
    <>
      <TopBar
        title="댕댕지도"
        rightSlot={
          step === "list" ? (
            <button type="button" onClick={() => router.push("/map")} className="text-xs">
              구 다시 선택
            </button>
          ) : null
        }
      />

      {step === "districts" ? (
        <div className="px-4 pb-6 pt-4">
          <div className="mb-4 text-sm font-bold text-ink">어느 구를 다녀볼까요?</div>
          <DistrictMap onSelect={handleSelectDistrict} />
        </div>
      ) : step === "traveling" ? (
        <TravelingDog destination={district ?? ""} />
      ) : (
        <div className="px-4 pb-6 pt-3">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Tag active={category === null} onClick={() => handleSelectCategory(null)}>
              전체
            </Tag>
            {CATEGORIES.map((c) => (
              <Tag key={c} active={category === c} onClick={() => handleSelectCategory(c)}>
                {c}
              </Tag>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {isLoading ? (
              <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
            ) : list.length === 0 ? (
              <div className="py-10 text-center text-xs text-ink-muted">
                {district}에 조건에 맞는 장소가 아직 없어요.
              </div>
            ) : (
              list.map((place) => <PlaceCard key={place.id} place={place} />)
            )}
          </div>
        </div>
      )}
    </>
  );
}
