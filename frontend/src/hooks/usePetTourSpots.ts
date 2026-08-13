import { useQuery } from "@tanstack/react-query";
import { mapPetTourSpotToPlace, type ApiPetTourSpot, type PickablePlace } from "@/lib/petTourMapper";

async function fetchPetTourPlaces(): Promise<PickablePlace[]> {
  // numOfRows는 "관광타입 하나당" 개수 — 12면 관광지·문화시설·레포츠·숙박·음식점 각각 최대 12곳씩, 최대 60곳 정도.
  const res = await fetch("/api/pet-tour-spots?numOfRows=12");
  if (!res.ok) throw new Error("장소 정보를 불러오지 못했어요");
  const data = (await res.json()) as { spots: ApiPetTourSpot[] };
  return data.spots
    .map(mapPetTourSpotToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/** 한국관광공사 반려동물 동반여행 서비스(대전) 기반 실제 장소 목록. 실패 시 호출부에서 mockPlaces로 폴백할 것. */
export function usePetTourSpots() {
  return useQuery({
    queryKey: ["pet-tour-spots"],
    queryFn: fetchPetTourPlaces,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
