"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { Tag } from "@/components/ui/Tag";
import { PlaceCard } from "@/components/place/PlaceCard";
import { DistrictMap } from "@/components/map/DistrictMap";
import { TravelingDog } from "@/components/map/TravelingDog";
import { usePlaces } from "@/hooks/usePlaces";
import { CATEGORIES } from "@/lib/placeFilters";
import type { DaejeonDistrict, PlaceCategory } from "@/types";

type MapStep = "districts" | "traveling" | "list";

export default function MapPage() {
  const [step, setStep] = useState<MapStep>("districts");
  const [district, setDistrict] = useState<DaejeonDistrict | null>(null);
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const { data: list = [], isLoading } = usePlaces({ district, category });

  useEffect(() => {
    if (step !== "traveling") return;
    const timer = setTimeout(() => setStep("list"), 1150);
    return () => clearTimeout(timer);
  }, [step]);

  const handleSelectDistrict = (next: DaejeonDistrict) => {
    setDistrict(next);
    setCategory(null);
    setStep("traveling");
  };

  return (
    <>
      <TopBar
        title="댕댕지도"
        rightSlot={
          step === "list" ? (
            <button type="button" onClick={() => setStep("districts")} className="text-xs">
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
            <Tag active={category === null} onClick={() => setCategory(null)}>
              전체
            </Tag>
            {CATEGORIES.map((c) => (
              <Tag key={c} active={category === c} onClick={() => setCategory(c)}>
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
