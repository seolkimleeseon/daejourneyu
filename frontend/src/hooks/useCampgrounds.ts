import { useQuery } from "@tanstack/react-query";
import { mapCampgroundToPlace, type ApiDaejeonCampground } from "@/lib/campgroundMapper";
import type { PickablePlace } from "@/lib/petTourMapper";

async function fetchCampgroundPlaces(): Promise<PickablePlace[]> {
  const res = await fetch("/api/campgrounds");
  if (!res.ok) throw new Error("캠핑장 정보를 불러오지 못했어요");
  const data = (await res.json()) as { campgrounds: ApiDaejeonCampground[] };
  return data.campgrounds
    .map(mapCampgroundToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/** 한국관광공사 고캠핑 정보(대전 인근, 숙박 카테고리 보강용). */
export function useCampgrounds(enabled = true) {
  return useQuery({
    queryKey: ["campgrounds"],
    queryFn: fetchCampgroundPlaces,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
