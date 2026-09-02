"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/cn";
import { useSheetStore } from "@/stores/useSheetStore";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { useKakaoPlacesMulti, type KakaoSearchTarget } from "@/hooks/useKakaoPlaces";
import type { PickablePlace } from "@/lib/petTourMapper";
import { CATEGORIES, CATEGORY_ICON, DISTRICTS } from "@/lib/placeFilters";
import type { DaejeonDistrict, PlaceCategory } from "@/types";

/** MIN_RESULTS_BEFORE_RELAX 미만이면 구 필터를 풀거나 카카오맵으로 더 찾아본다 */
const MIN_RESULTS_BEFORE_RELAX = 4;

// 카카오 키워드 검색은 업체에 실제로 태그된 문구만 매칭한다(리뷰 전문 검색이 아니다) — 그래서
// 카테고리마다 실제로 결과가 나오는 문구가 다르다(직접 카카오맵에서 검색해 확인함):
//   - "반려동물 동반"은 거의 매칭이 안 됨(0건)
//   - "애견동반"은 맛집·카페엔 실제 태그로 잘 걸려 정확도가 오른다
//   - 공원·문화시설은 애초에 이런 반려동물 태그가 없어서 넣으면 오히려 0건이 된다 — 일반 카테고리어를 유지한다
//   - 놀이터는 카카오에 "반려견놀이터"라는 실제 업종 카테고리가 있어 원래 문구로도 잘 잡힌다
const CATEGORY_KAKAO_KEYWORD: Record<PlaceCategory, string> = {
  산책: "공원",
  놀이터: "반려동물 놀이터",
  맛집: "애견동반 맛집",
  문화: "문화시설",
};

/**
 * 소스별 신뢰도 티어를 매긴다 — 낮을수록 먼저 보여준다. backend/scripts/syncPlaces.ts가
 * Place.sourceTier로 이미 매겨서(1=반려동물 동반 인증 소스, 2=공공데이터 미인증) 응답에 실어주므로
 * 그대로 쓰고, 카카오맵 실시간 검색 결과(Place 테이블 밖, id가 "kakao-"로 시작)만 3으로 취급한다.
 */
function getTrustTier(place: PickablePlace): number {
  if (place.id.startsWith("kakao-")) return 3;
  return place.sourceTier ?? 2;
}

/** 신뢰도 티어 우선 → 같은 티어 안에서는 사진 있는 카드 우선으로 정렬한다. */
function sortByQuality(list: PickablePlace[]): PickablePlace[] {
  return [...list].sort((a, b) => {
    const tierDiff = getTrustTier(a) - getTrustTier(b);
    if (tierDiff !== 0) return tierDiff;
    return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
  });
}

function PickablePlaceCard({
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
            {CATEGORY_ICON[place.category]}
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
          {CATEGORY_ICON[place.category]} {place.category}
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
  // Place 테이블(backend/scripts/syncPlaces.ts가 9개 공공데이터 소스+문체부 CSV를 정규화·dedupe해 채움)
  // 하나만 부르면 된다 — 예전엔 소스별로 훅을 따로 불러 여기서 이름 기준으로 병합했다(커밋 0b5c8ac).
  const { data: fetchedPlaces, isLoading, isError } = usePickablePlaces(isOpen);
  const places = fetchedPlaces ?? [];

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
    const counts: Record<PlaceCategory, number> = { 산책: 0, 놀이터: 0, 맛집: 0, 문화: 0 };
    const q = query.trim();
    for (const place of places) {
      const matchesDistrict = district === "전체" || place.district === district;
      if (matchesDistrict && matchesQuery(place, q)) counts[place.category] += 1;
    }
    return counts;
  }, [places, district, query]);
  const kakaoTargets = useMemo<KakaoSearchTarget[]>(() => {
    const q = query.trim();
    // 검색어를 직접 입력했으면, 카테고리 단어 대신 그 검색어 자체로 카카오에 물어본다 — DB에 없는
    // 장소라도 사용자가 정확한 이름을 알고 있으면 찾을 수 있어야 한다(전에는 이 텍스트를 카카오
    // 검색엔 전혀 안 넘기고, 카테고리 기본 검색 결과를 사후에 이름으로 걸러내기만 했다).
    if (q) {
      return [
        {
          category: activeCategory ?? "문화",
          query: `대전 ${district !== "전체" ? district : ""} ${q}`.replace(/\s+/g, " ").trim(),
        },
      ];
    }
    const categoriesToCheck = activeCategory ? [activeCategory] : CATEGORIES;
    const sparse = categoriesToCheck.filter((cat) => categoryCounts[cat] < MIN_RESULTS_BEFORE_RELAX);
    return sparse.map((cat) => ({
      category: cat,
      query: `대전 ${district !== "전체" ? district : ""} ${CATEGORY_KAKAO_KEYWORD[cat]}`.replace(/\s+/g, " ").trim(),
    }));
  }, [query, categoryCounts, activeCategory, district]);
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
        <Tag tone="neutral-ghost" active={category === "전체"} className="shrink-0" onClick={() => setCategory("전체")}>
          전체
        </Tag>
        {CATEGORIES.map((cat) => (
          <Tag key={cat} tone="neutral-ghost" active={category === cat} className="shrink-0" onClick={() => setCategory(cat)}>
            {CATEGORY_ICON[cat]} {cat}
          </Tag>
        ))}
      </div>
      <div className="mb-3 flex gap-1 overflow-x-auto pb-0.5">
        <Tag tone="neutral-ghost" active={district === "전체"} className="shrink-0" onClick={() => setDistrict("전체")}>
          🧭 전체 구
        </Tag>
        {DISTRICTS.map((gu) => (
          <Tag key={gu} tone="neutral-ghost" active={district === gu} className="shrink-0" onClick={() => setDistrict(gu)}>
            {gu}
          </Tag>
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
            <PickablePlaceCard
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
              <PickablePlaceCard
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
              <PickablePlaceCard
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
