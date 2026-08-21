import { useQuery } from "@tanstack/react-query";
import { mapPetFacilityToPlace, type ApiPetFacility } from "@/lib/petFacilityMapper";
import type { PickablePlace } from "@/lib/petTourMapper";

async function fetchPetFacilityPlaces(): Promise<PickablePlace[]> {
  const res = await fetch("/api/pet-facilities");
  if (!res.ok) throw new Error("반려동물 동반 시설 정보를 불러오지 못했어요");
  const data = (await res.json()) as { facilities: ApiPetFacility[] };
  return data.facilities
    .map(mapPetFacilityToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/** 대전관광공사_대전 반려동물 동반 시설 안내(맛집·산책·놀이터·숙박 보강용). */
export function usePetFacilities(enabled = true) {
  return useQuery({
    queryKey: ["pet-facilities"],
    queryFn: fetchPetFacilityPlaces,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
