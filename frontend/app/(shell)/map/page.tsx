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

/** 한 번에 다 그리면 카드가 많을 때 느려진다 — PlacePickerSheet와 동일하게 "더 보기"로 나눠 보여준다. */
const PAGE_SIZE = 20;

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 검색은 서버 쿼리가 아니라 이미 받아온 목록을 이름·동반조건으로 한 번 더 좁히는 클라이언트 필터다.
  const [query, setQuery] = useState("");
  const q = query.trim();
  const filteredList = q
    ? list.filter((place) => place.name.includes(q) || place.condition.includes(q))
    : list;
  const visibleList = filteredList.slice(0, visibleCount);

  useEffect(() => {
    if (!traveling) return;
    const timer = setTimeout(() => setTraveling(false), 1500);
    return () => clearTimeout(timer);
  }, [traveling]);

  // 구가 바뀌면 이전 구에서 치던 검색어는 의미가 없으니 비운다.
  useEffect(() => {
    setQuery("");
  }, [district]);

  // 필터(구·카테고리·검색어)가 바뀌면 이전 필터의 "더 보기" 진행분은 의미가 없으니 되돌린다.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [district, category, query]);

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
          {!isLoading && list.length > 0 ? (
            <div className="sticky top-14 z-10 -mx-4 mb-3 border-b border-line bg-surface px-4 pb-3">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`${district}에서 장소 이름·조건 검색`}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:bg-card"
              />
            </div>
          ) : null}

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

          {isLoading ? (
            <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-muted">
              {district}에 조건에 맞는 장소가 아직 없어요.
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-muted">
              ‘{q}’ 검색 결과가 없어요.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                {visibleList.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
              {filteredList.length > visibleList.length ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="mt-3 w-full rounded-lg border border-line bg-surface py-2.5 text-xs font-semibold text-ink-muted"
                >
                  더 보기 · {filteredList.length - visibleList.length}곳 남음
                </button>
              ) : null}
            </>
          )}
        </div>
      )}
    </>
  );
}
