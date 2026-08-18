"use client";

import { useMemo, useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useSheetStore } from "@/stores/useSheetStore";
import { usePetTourSpots } from "@/hooks/usePetTourSpots";
import { useDaejeonParks } from "@/hooks/useDaejeonParks";
import { usePetFacilities } from "@/hooks/usePetFacilities";
import { useVerifiedPetRestaurants } from "@/hooks/useVerifiedPetRestaurants";
import { useDaejeonPlaces } from "@/hooks/useDaejeonPlaces";
import { useCampgrounds } from "@/hooks/useCampgrounds";
import { useKakaoPlacesMulti, type KakaoSearchTarget } from "@/hooks/useKakaoPlaces";
import type { PickablePlace } from "@/lib/petTourMapper";
import type { DaejeonDistrict, PlaceCategory } from "@/types";

/** MIN_RESULTS_BEFORE_RELAX 미만이면 구 필터를 풀거나 카카오맵으로 더 찾아본다 */
const MIN_RESULTS_BEFORE_RELAX = 4;

// TODO(player1-pr): place.ts의 PlaceCategory에서 "숙박"이 실제로 빠지면(player1 PR 머지 후)
// 이 파일에서도 "숙박" 관련 항목을 함께 정리한다. 지금은 데이터(캠핑장·관광공사 숙박)를
// 전부 "문화"로 매핑해두었으니 "숙박" 카테고리로 들어오는 place는 없다.
const CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화"];
const CATEGORY_EMOJI: Record<PlaceCategory, string> = {
  산책: "🌳",
  놀이터: "🐾",
  맛집: "🥐",
  문화: "🏛️",
  숙박: "🏨",
};
const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];
const CATEGORY_KAKAO_KEYWORD: Record<PlaceCategory, string> = {
  산책: "공원",
  놀이터: "반려동물 놀이터",
  맛집: "맛집",
  문화: "문화시설",
  숙박: "숙박",
};

/**
 * id 접두사로 소스별 신뢰도 티어를 매긴다 — 낮을수록 먼저 보여준다.
 * 1: 반려동물 동반 여부가 실제로 인증/필터링된 소스(관광공사·식약처·대전관광공사·고캠핑)
 * 2: 공식 공공데이터지만 반려동물 동반 인증까지는 아닌 소스(공원·문화·숙박·관광지·모범음식점)
 * 3: 카카오맵 검색(확인 필요)
 */
const TRUST_TIER_PREFIXES: [string, number][] = [
  ["pettour-", 1],
  ["foodsafety-", 1],
  ["petfac-", 1],
  ["camp-", 1],
  ["park-", 2],
  ["daejeon-", 2],
  ["kakao-", 3],
];

function getTrustTier(place: PickablePlace): number {
  return TRUST_TIER_PREFIXES.find(([prefix]) => place.id.startsWith(prefix))?.[1] ?? 2;
}

/** 신뢰도 티어 우선 → 같은 티어 안에서는 사진 있는 카드 우선으로 정렬한다. */
function sortByQuality(list: PickablePlace[]): PickablePlace[] {
  return [...list].sort((a, b) => {
    const tierDiff = getTrustTier(a) - getTrustTier(b);
    if (tierDiff !== 0) return tierDiff;
    return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
  });
}

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

function PlaceCard({
  place,
  isAdded,
  onClick,
}: {
  place: PickablePlace;
  isAdded: boolean;
  onClick: () => void;
}) {
  // 외부(카카오 이미지 검색·공공데이터) 사진 URL은 원본이 내려가거나 만료돼 깨져 있는 경우가 있다 —
  // 로드 실패하면 깨진 이미지 아이콘 대신 이모지 카드로 조용히 전환한다.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = place.imageUrl && !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-xl border text-left transition-colors",
        isAdded ? "border-brand bg-brand-100" : "border-line bg-card"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-surface">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.imageUrl ?? undefined}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
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
}

/** 여러 화면(코스 위저드·일정 추가)에서 공용으로 쓰는 장소 선택 바텀시트. useSheetStore로 열림/선택 상태를 공유한다. */
export function PlacePickerSheet() {
  const { isOpen, title, selected, toggle, close } = useSheetStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "전체">("전체");
  const [district, setDistrict] = useState<DaejeonDistrict | "전체">("전체");
  // TODO(mock): mockPlaces 혼합은 잠시 뺐다 — 실데이터(관광공사+대전시 공원+공식 인증 소스+카카오)만으로
  // 얼마나 채워지는지 먼저 확인하기 위함.
  const { data: apiPlaces, isLoading, isError } = usePetTourSpots(isOpen);
  // 산책 카테고리는 관광공사 데이터만으론 커버리지가 좁아 대전시 공식 도시공원정보로 보강한다.
  const { data: parkPlaces } = useDaejeonParks(isOpen);
  // 대전관광공사 반려동물 동반시설(맛집·산책·놀이터·숙박) — 정부기관이 직접 인증한 목록.
  const { data: facilityPlaces } = usePetFacilities(isOpen);
  // 식약처 반려동물 동반출입 음식점 정식 등록 목록 — 맛집 카테고리 최고 신뢰도 소스.
  const { data: verifiedRestaurantPlaces } = useVerifiedPetRestaurants(isOpen);
  // 대전시 문화시설·숙박·관광지 공공데이터 — 문화/숙박 카테고리 보강용.
  const { data: culturePlaces } = useDaejeonPlaces("culture", isOpen);
  const { data: lodgingPlaces } = useDaejeonPlaces("lodging", isOpen);
  const { data: tourspotPlaces } = useDaejeonPlaces("tourspot", isOpen);
  const { data: exemplaryRestaurantPlaces } = useDaejeonPlaces("restaurant", isOpen);
  // 한국관광공사 고캠핑 정보(대전 인근) — 숙박 카테고리 보강용.
  const { data: campgroundPlaces } = useCampgrounds(isOpen);
  const places: PickablePlace[] = useMemo(() => {
    const merged = [...(apiPlaces ?? [])];
    const knownNames = new Set(merged.map((place) => place.name));
    const addAll = (extra: PickablePlace[] | undefined) => {
      for (const place of extra ?? []) {
        if (knownNames.has(place.name)) continue;
        knownNames.add(place.name);
        merged.push(place);
      }
    };
    addAll(verifiedRestaurantPlaces);
    addAll(facilityPlaces);
    addAll(parkPlaces);
    addAll(culturePlaces);
    addAll(lodgingPlaces);
    addAll(tourspotPlaces);
    addAll(exemplaryRestaurantPlaces);
    addAll(campgroundPlaces);
    return merged;
  }, [
    apiPlaces,
    parkPlaces,
    facilityPlaces,
    verifiedRestaurantPlaces,
    culturePlaces,
    lodgingPlaces,
    tourspotPlaces,
    exemplaryRestaurantPlaces,
    campgroundPlaces,
  ]);

  const matchesQuery = (place: PickablePlace, q: string) =>
    !q || place.name.includes(q) || place.district.includes(q) || place.category.includes(q);

  const strict = useMemo(() => {
    const q = query.trim();
    const matched = places.filter((place) => {
      const matchesCategory = category === "전체" || place.category === category;
      const matchesDistrict = district === "전체" || place.district === district;
      return matchesCategory && matchesDistrict && matchesQuery(place, q);
    });
    return sortByQuality(matched);
  }, [places, query, category, district]);

  // 카테고리+구를 같이 걸면 실데이터가 적어 결과가 텅 빌 수 있다 — 구 조건만 풀어서 후보를 더 보여준다.
  const relaxed = useMemo(() => {
    if (district === "전체" || strict.length >= MIN_RESULTS_BEFORE_RELAX) return [];
    const q = query.trim();
    const strictIds = new Set(strict.map((place) => place.id));
    const matched = places.filter((place) => {
      if (strictIds.has(place.id)) return false;
      const matchesCategory = category === "전체" || place.category === category;
      return matchesCategory && matchesQuery(place, q);
    });
    return sortByQuality(matched);
  }, [places, query, category, district, strict]);

  // 정부 데이터로도 여전히 빈약하면 카카오맵 키워드 검색으로 보완한다.
  // "전체" 카테고리로 볼 때 strict.length(5개 카테고리 합산)만 보면, 산책(공원) 하나만 많아도
  // 맛집·문화·숙박·놀이터가 0개인 채로 "충분하다"고 오판해 카카오 검색이 아예 안 켜지는 버그가 있었다 —
  // 그래서 카테고리별로 따로 개수를 세서 부족한 카테고리만 카카오로 채운다.
  const activeCategory = category !== "전체" ? category : null;
  const categoryCounts = useMemo(() => {
    const counts: Record<PlaceCategory, number> = { 산책: 0, 놀이터: 0, 맛집: 0, 문화: 0, 숙박: 0 };
    const q = query.trim();
    for (const place of places) {
      const matchesDistrict = district === "전체" || place.district === district;
      if (matchesDistrict && matchesQuery(place, q)) counts[place.category] += 1;
    }
    return counts;
  }, [places, district, query]);
  const kakaoTargets = useMemo<KakaoSearchTarget[]>(() => {
    const categoriesToCheck = activeCategory ? [activeCategory] : CATEGORIES;
    const sparse = categoriesToCheck.filter((cat) => categoryCounts[cat] < MIN_RESULTS_BEFORE_RELAX);
    return sparse.map((cat) => ({
      category: cat,
      query: `대전 ${district !== "전체" ? district : ""} ${CATEGORY_KAKAO_KEYWORD[cat]}`.replace(/\s+/g, " ").trim(),
    }));
  }, [categoryCounts, activeCategory, district]);
  const { places: kakaoPlaces, isLoading: isKakaoLoading } = useKakaoPlacesMulti(
    kakaoTargets,
    isOpen && kakaoTargets.length > 0
  );
  const kakaoExtra = useMemo(() => {
    if (!kakaoPlaces.length) return [];
    const q = query.trim();
    const knownNames = new Set([...strict, ...relaxed].map((place) => place.name));
    const matched = kakaoPlaces.filter((place) => !knownNames.has(place.name) && matchesQuery(place, q));
    return sortByQuality(matched); // 카카오 단일 티어지만 사진 있는 카드를 앞으로 정렬
  }, [kakaoPlaces, strict, relaxed, query]);

  return (
    <BottomSheet
      open={isOpen}
      onClose={close}
      title={title}
      footer={
        <Button
          onClick={close}
          disabled={selected.length === 0}
          className="disabled:bg-steel-400 disabled:opacity-100"
        >
          {selected.length ? `✓ ${selected.length}곳 담았어요 · 완료` : "장소를 선택해 담아보세요"}
        </Button>
      }
    >
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
          : isError
            ? "실시간 장소를 불러오지 못했어요"
            : `🐾 동반 인증 · ${strict.length}곳`}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {strict.length ? (
          strict.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              isAdded={selected.some((item) => item.id === place.id)}
              onClick={() => toggle(place)}
            />
          ))
        ) : (
          <div className="col-span-2 py-6 text-center text-xs text-ink-muted">
            {district !== "전체" ? `${district}엔 조건에 맞는 장소가 아직 적어요` : "검색 결과가 없어요"}
          </div>
        )}
      </div>

      {relaxed.length ? (
        <>
          <div className="mb-2 text-[10px] font-semibold text-ink-muted">
            📍 {district} 결과가 적어서 대전 다른 지역 장소도 같이 보여드려요
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {relaxed.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isAdded={selected.some((item) => item.id === place.id)}
                onClick={() => toggle(place)}
              />
            ))}
          </div>
        </>
      ) : null}

      {isKakaoLoading ? (
        <div className="mb-3 text-[10px] text-ink-muted">🌐 카카오맵에서 더 찾아보는 중이에요...</div>
      ) : null}

      {kakaoExtra.length ? (
        <>
          <div className="mb-2 text-[10px] font-semibold text-ink-muted">
            🌐 카카오맵에서 찾은 장소 · 반려동물 동반 가능 여부는 방문 전 확인해주세요
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {kakaoExtra.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isAdded={selected.some((item) => item.id === place.id)}
                onClick={() => toggle(place)}
              />
            ))}
          </div>
        </>
      ) : null}
    </BottomSheet>
  );
}
