"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useSheetStore } from "@/stores/useSheetStore";
import { usePetTourSpots } from "@/hooks/usePetTourSpots";
import { ensureCategoryMinimum } from "@/lib/petTourMapper";
import { mockPlaces } from "@/mocks";
import type { DaejeonDistrict, Place, PlaceCategory } from "@/types";

/** mockPlaces(사진 없음)와 실시간 데이터(사진 있음)를 같이 다루기 위한 표시용 타입 — Place는 그대로 두고 여기서만 확장 */
type DisplayPlace = Place & { imageUrl?: string | null };

const MIN_PER_CATEGORY = 3;

const CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화", "숙박"];
const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  산책: "🌳",
  놀이터: "🐾",
  맛집: "🥐",
  문화: "🏛️",
  숙박: "🏨",
};
const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "shrink-0 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white"
          : "shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted"
      }
    >
      {children}
    </button>
  );
}

/** 여러 화면(코스 위저드·일정 추가)에서 공용으로 쓰는 장소 선택 바텀시트. useSheetStore로 열림/선택 상태를 공유한다. */
export function PlacePickerSheet() {
  const { isOpen, title, selected, toggle, close } = useSheetStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "전체">("전체");
  const [district, setDistrict] = useState<DaejeonDistrict | "전체">("전체");
  const { data: apiPlaces, isLoading, isError } = usePetTourSpots();
  const places: DisplayPlace[] = useMemo(
    () => ensureCategoryMinimum(apiPlaces ?? [], mockPlaces, MIN_PER_CATEGORY),
    [apiPlaces]
  );
  const usingLiveData = !!apiPlaces && apiPlaces.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim();
    return places.filter((place) => {
      const matchesCategory = category === "전체" || place.category === category;
      const matchesDistrict = district === "전체" || place.district === district;
      const matchesQuery = !q || place.name.includes(q) || place.district.includes(q) || place.category.includes(q);
      return matchesCategory && matchesDistrict && matchesQuery;
    });
  }, [places, query, category, district]);

  return (
    <BottomSheet open={isOpen} onClose={close} title={title}>
      <input
        className="mb-3 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none focus:border-brand focus:bg-card"
        placeholder="장소·지역 검색 (예: 갑천, 유성구)"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="mb-1.5 flex gap-1 overflow-x-auto pb-0.5">
        <FilterChip active={category === "전체"} onClick={() => setCategory("전체")}>
          전체
        </FilterChip>
        {CATEGORIES.map((cat) => (
          <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
            {CATEGORY_EMOJI[cat]} {cat}
          </FilterChip>
        ))}
      </div>
      <div className="mb-3 flex gap-1 overflow-x-auto pb-0.5">
        <FilterChip active={district === "전체"} onClick={() => setDistrict("전체")}>
          🧭 전체 구
        </FilterChip>
        {DISTRICTS.map((gu) => (
          <FilterChip key={gu} active={district === gu} onClick={() => setDistrict(gu)}>
            {gu}
          </FilterChip>
        ))}
      </div>

      <div className="mb-2 text-[10px] text-ink-muted">
        {isLoading
          ? "실시간 반려동물 동반여행지를 불러오는 중이에요..."
          : usingLiveData
            ? `🐾 실시간 데이터 + 카테고리별 추천 · ${filtered.length}곳`
            : isError
              ? "실시간 장소를 못 불러와서 기본 목록을 보여드려요"
              : `${filtered.length}곳`}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {filtered.length ? (
          filtered.map((place) => {
            const isAdded = selected.some((item) => item.id === place.id);
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => toggle(place)}
                className={cn(
                  "overflow-hidden rounded-xl border text-left transition-colors",
                  isAdded ? "border-brand bg-brand-100" : "border-line bg-card"
                )}
              >
                <div className="relative aspect-[4/3] w-full bg-surface">
                  {place.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={place.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      {CATEGORY_EMOJI[place.category]}
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {CATEGORY_EMOJI[place.category]} {place.category}
                  </span>
                  {isAdded ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-2xl font-bold text-white">
                      ✓
                    </div>
                  ) : null}
                  {!place.petFriendly ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-accent-coral px-2 py-0.5 text-[10px] font-semibold text-white">
                      🚫 동반 불가
                    </span>
                  ) : null}
                </div>
                <div className="p-2">
                  <div className="truncate text-xs font-bold text-ink">{place.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-ink-muted">📍 {place.district}</div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 py-6 text-center text-xs text-ink-muted">검색 결과가 없어요</div>
        )}
      </div>

      <div className="sticky bottom-0 bg-card pt-1">
        <Button onClick={close} disabled={selected.length === 0}>
          {selected.length ? `✓ ${selected.length}곳 담았어요 · 완료` : "장소를 선택해 담아보세요"}
        </Button>
      </div>
    </BottomSheet>
  );
}
